import { RequestHandler } from "express";
import {
  Report,
  CreateReportRequest,
  CreateReportResponse,
  GetReportsResponse,
  UpdateReportRequest,
  ReportStatus,
  ReportCategory,
} from "@shared/api";
import { notifyNewReport } from "./notifications";
import { authenticateAdmin, createToken, setAuthCookie } from "../auth-utils";

// In-memory storage for demo (replace with actual database in production)
let reports: Report[] = [];
let reportIdCounter = 1;

// Load admin credentials from environment variables
const getAdminCredentials = () => {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD environment variables are required');
  }

  return { username, password };
};

export const createReport: RequestHandler = (req, res) => {
  try {
    console.log("Received report submission with media"); // Debug log (no sensitive data)
    const {
      message,
      category,
      severity,
      photo_url,
      video_url,
      video_metadata,
      encrypted_data,
      is_encrypted,
    }: CreateReportRequest = req.body;

    // Validate video metadata if video is provided
    if (video_url && video_metadata) {
      const maxSizeMB = 100;
      const maxDurationMinutes = 5;
      const allowedFormats = ["video/mp4", "video/webm", "video/quicktime"];

      if (video_metadata.size > maxSizeMB * 1024 * 1024) {
        console.log("Error: Video file too large");
        return res.status(400).json({
          error: `Video file too large. Maximum size is ${maxSizeMB}MB`,
        });
      }

      if (video_metadata.duration > maxDurationMinutes * 60) {
        console.log("Error: Video duration too long");
        return res.status(400).json({
          error: `Video too long. Maximum duration is ${maxDurationMinutes} minutes`,
        });
      }

      if (!allowedFormats.includes(video_metadata.format)) {
        console.log("Error: Invalid video format");
        return res.status(400).json({
          error: `Invalid video format. Allowed formats: ${allowedFormats.join(", ")}`,
        });
      }

      console.log("Video validation passed:", {
        size: `${(video_metadata.size / 1024 / 1024).toFixed(2)}MB`,
        duration: `${(video_metadata.duration / 60).toFixed(2)}min`,
        format: video_metadata.format,
        isRecorded: video_metadata.isRecorded,
      });
    }

    // Handle both encrypted and plain text reports
    if (is_encrypted && encrypted_data) {
      // Encrypted report validation
      if (
        !encrypted_data.encryptedMessage ||
        !encrypted_data.encryptedCategory
      ) {
        console.log("Error: Encrypted data is incomplete");
        return res.status(400).json({ error: "Invalid encrypted data" });
      }
      console.log("Processing encrypted report with media");
    } else {
      // Plain text report validation
      if (!message || message.trim().length === 0) {
        console.log("Error: Message is required");
        return res.status(400).json({ error: "Message is required" });
      }

      if (!category) {
        console.log("Error: Category is required");
        return res.status(400).json({ error: "Category is required" });
      }

      const validCategories = [
        "harassment",
        "medical",
        "emergency",
        "safety",
        "feedback",
      ];
      if (!validCategories.includes(category)) {
        console.log("Error: Invalid category:", category);
        return res.status(400).json({ error: "Invalid category" });
      }
      console.log("Processing plain text report");
    }

    const validSeverities = ["low", "medium", "high", "urgent"];
    if (severity && !validSeverities.includes(severity)) {
      console.log("Error: Invalid severity:", severity);
      return res.status(400).json({ error: "Invalid severity level" });
    }

    const newReport: Report = {
      id: `report_${reportIdCounter++}`,
      message: is_encrypted ? "[ENCRYPTED]" : (message || "").trim(),
      category: is_encrypted
        ? ("harassment" as ReportCategory)
        : category || "feedback",
      severity: severity || "medium",
      photo_url: is_encrypted ? undefined : photo_url,
      video_url: is_encrypted ? undefined : video_url,
      video_metadata: is_encrypted ? undefined : video_metadata,
      created_at: new Date().toISOString(),
      status: "pending" as ReportStatus,
      encrypted_data: encrypted_data,
      is_encrypted: is_encrypted || false,
    };

    // Auto-flag urgent reports (check severity since category might be encrypted)
    if (severity === "urgent") {
      newReport.status = "flagged";
    }

    reports.push(newReport);
    console.log("Report created successfully:", newReport.id); // Debug log

    // Send real-time notification to admins
    notifyNewReport(newReport);

    const response: CreateReportResponse = {
      id: newReport.id,
      message: newReport.message,
      created_at: newReport.created_at,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getReports: RequestHandler = (req, res) => {
  // First authenticate the admin
  authenticateAdmin(req, res, () => {
    try {
      const { status } = req.query;

      let filteredReports = reports;
      if (status && typeof status === "string") {
        filteredReports = reports.filter((report) => report.status === status);
      }

      // Sort by newest first
      filteredReports.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      const response: GetReportsResponse = {
        reports: filteredReports,
        total: filteredReports.length,
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
};

export const getReportStatus: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const report = reports.find((report) => report.id === id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Return limited information for anonymous status check
    const statusInfo = {
      id: report.id,
      status: report.status,
      created_at: report.created_at,
      admin_response: report.admin_response || null,
      admin_response_at: report.admin_response_at || null,
    };

    res.json(statusInfo);
  } catch (error) {
    console.error("Error fetching report status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateReport: RequestHandler = (req, res) => {
  // First authenticate the admin
  authenticateAdmin(req, res, () => {
    try {
      const { id } = req.params;
      const { status, admin_response }: UpdateReportRequest = req.body;

      const reportIndex = reports.findIndex((report) => report.id === id);
      if (reportIndex === -1) {
        return res.status(404).json({ error: "Report not found" });
      }

      if (status) {
        reports[reportIndex].status = status;
      }

      if (admin_response !== undefined) {
        reports[reportIndex].admin_response = admin_response;
        reports[reportIndex].admin_response_at = new Date().toISOString();
      }

      res.json(reports[reportIndex]);
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
};

export const adminLogin: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;
    const { username: adminUsername, password: adminPassword } = getAdminCredentials();

    // Secure credential verification
    if (username === adminUsername && password === adminPassword) {
      // Generate secure JWT token
      const token = createToken(username);

      // Set secure HTTP-only cookie
      setAuthCookie(res, token);

      res.json({
        success: true,
        token, // Also return for header-based auth
      });
    } else {
      // Add small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));

      res
        .status(401)
        .json({ success: false, error: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Error in admin login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
