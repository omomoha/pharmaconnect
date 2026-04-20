import { apiClient } from '../api';
import type { ApiResponse } from '@/shared/types';

/**
 * Create a new support ticket
 */
export async function createTicket(data: {
  subject: string;
  description: string;
  category: string;
  userName?: string;
}): Promise<ApiResponse<any>> {
  try {
    const response = await apiClient.post('/support/tickets', data);
    return response;
  } catch (error) {
    console.error('Failed to create support ticket:', error);
    return {
      success: false,
      error: { code: 'CREATE_TICKET_ERROR', message: 'Failed to create support ticket' },
    };
  }
}

/**
 * Get current user's tickets
 */
export async function getMyTickets(): Promise<ApiResponse<any[]>> {
  try {
    const response = await apiClient.get('/support/tickets');
    return response;
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    return {
      success: false,
      error: { code: 'FETCH_TICKETS_ERROR', message: 'Failed to fetch support tickets' },
    };
  }
}

/**
 * Get all tickets (admin)
 */
export async function getAllTickets(status?: string): Promise<ApiResponse<any[]>> {
  try {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get(`/support/tickets/all${params}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch all tickets:', error);
    return {
      success: false,
      error: { code: 'FETCH_ALL_TICKETS_ERROR', message: 'Failed to fetch tickets' },
    };
  }
}

/**
 * Admin responds to a ticket
 */
export async function respondToTicket(ticketId: string, response: string): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.post(`/support/tickets/${ticketId}/respond`, { response });
    return res;
  } catch (error) {
    console.error('Failed to respond to ticket:', error);
    return {
      success: false,
      error: { code: 'RESPOND_TICKET_ERROR', message: 'Failed to respond to ticket' },
    };
  }
}

/**
 * Close a ticket
 */
export async function closeTicket(ticketId: string): Promise<ApiResponse<any>> {
  try {
    const response = await apiClient.post(`/support/tickets/${ticketId}/close`, {});
    return response;
  } catch (error) {
    console.error('Failed to close ticket:', error);
    return {
      success: false,
      error: { code: 'CLOSE_TICKET_ERROR', message: 'Failed to close ticket' },
    };
  }
}
