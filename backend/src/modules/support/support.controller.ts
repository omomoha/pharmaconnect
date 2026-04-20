import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { SupportService } from "./support.service.js";
import { apiResponse } from "../../utils/helpers.js";
import logger from "../../utils/logger.js";

export class SupportController {
  /**
   * POST /support/tickets — Create a new ticket
   */
  static async createTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { subject, description, category } = req.body;
      if (!subject || !description || !category) {
        res.status(400).json(apiResponse(false, undefined, {
          code: "VALIDATION_ERROR",
          message: "Subject, description, and category are required",
        }));
        return;
      }

      const ticket = await SupportService.createTicket({
        userId: req.user!.uid,
        userEmail: req.user!.email,
        userName: req.body.userName || req.user!.email,
        userRole: req.user!.role || "customer",
        subject,
        description,
        category,
      });

      res.status(201).json(apiResponse(true, ticket));
    } catch (error) {
      logger.error("Create ticket error:", error);
      res.status(500).json(apiResponse(false, undefined, {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create support ticket",
      }));
    }
  }

  /**
   * GET /support/tickets — Get current user's tickets
   */
  static async getUserTickets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tickets = await SupportService.getUserTickets(req.user!.uid);
      res.json(apiResponse(true, tickets));
    } catch (error) {
      logger.error("Get user tickets error:", error);
      res.status(500).json(apiResponse(false, undefined, {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch support tickets",
      }));
    }
  }

  /**
   * GET /support/tickets/all — Get all tickets (admin only)
   */
  static async getAllTickets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const tickets = await SupportService.getAllTickets(status);
      res.json(apiResponse(true, tickets));
    } catch (error) {
      logger.error("Get all tickets error:", error);
      res.status(500).json(apiResponse(false, undefined, {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch support tickets",
      }));
    }
  }

  /**
   * GET /support/tickets/:ticketId — Get single ticket
   */
  static async getTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const ticket = await SupportService.getTicketById(ticketId);
      if (!ticket) {
        res.status(404).json(apiResponse(false, undefined, {
          code: "NOT_FOUND",
          message: "Ticket not found",
        }));
        return;
      }
      // Non-admin users can only see their own tickets
      if (req.user!.role !== "platform_admin" && req.user!.role !== "support_admin" && ticket.userId !== req.user!.uid) {
        res.status(403).json(apiResponse(false, undefined, {
          code: "FORBIDDEN",
          message: "You do not have permission to view this ticket",
        }));
        return;
      }
      res.json(apiResponse(true, ticket));
    } catch (error) {
      logger.error("Get ticket error:", error);
      res.status(500).json(apiResponse(false, undefined, {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch ticket",
      }));
    }
  }

  /**
   * POST /support/tickets/:ticketId/respond — Admin responds to ticket
   */
  static async respondToTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const { response } = req.body;
      if (!response) {
        res.status(400).json(apiResponse(false, undefined, {
          code: "VALIDATION_ERROR",
          message: "Response text is required",
        }));
        return;
      }
      const ticket = await SupportService.respondToTicket(ticketId, req.user!.uid, response);
      res.json(apiResponse(true, ticket));
    } catch (error) {
      logger.error("Respond to ticket error:", error);
      res.status(500).json(apiResponse(false, undefined, {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to respond to ticket",
      }));
    }
  }

  /**
   * POST /support/tickets/:ticketId/close — Close a ticket
   */
  static async closeTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const ticket = await SupportService.closeTicket(ticketId, req.user!.uid);
      res.json(apiResponse(true, ticket));
    } catch (error) {
      logger.error("Close ticket error:", error);
      res.status(500).json(apiResponse(false, undefined, {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to close ticket",
      }));
    }
  }
}
