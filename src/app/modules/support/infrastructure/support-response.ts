import { TicketStatus } from '../domain/model/ticket.entity';
import { VisitStatus } from '../domain/model/visit.entity';

/*
  These resources mirror the JSON produced by the support-maintenance service
  (port 8083 in the backend repository). The service returns its domain
  aggregates directly, so identifiers are not called "id":
  articleId, technicianId, ticketId, replyId, photoId, ratingId, visitId,
  assignmentId and diagnosisId.
*/

export interface ArticleResource {
  articleId: string;
  title: string;
  category: string;
  contentReference: string;
  publishedAt: string | null;
  active: boolean;
}

export interface ArticleInputResource {
  title: string;
  category: string;
  contentReference: string;
}

export interface TechnicianResource {
  technicianId: string;
  fullName: string;
  accreditationCode: string;
  email: string;
  phone: string;
  available: boolean;
  active: boolean;
}

export interface TechnicianInputResource {
  fullName: string;
  accreditationCode: string;
  email: string;
  phone: string;
}

export interface TicketResource {
  ticketId: string;
  principalAccountId: string;
  meterId: string;
  subject: string;
  message: string;
  status: TicketStatus;
  createdAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
}

export interface TicketInputResource {
  principalAccountId: string;
  meterId: string;
  subject: string;
  message: string;
}

export interface ReplyResource {
  replyId: string;
  ticketId: string;
  authorAccountId: string;
  body: string;
  postedAt: string;
}

export interface ReplyInputResource {
  authorAccountId: string;
  body: string;
}

export interface PhotoResource {
  photoId: string;
  ticketId: string;
  objectReference: string;
  uploadedByAccountId: string;
  uploadedAt: string;
}

export interface PhotoInputResource {
  objectReference: string;
  uploadedByAccountId: string;
}

export interface RatingResource {
  ratingId: string;
  ticketId: string;
  score: number;
  comment: string | null;
  ratedAt: string;
}

export interface RatingInputResource {
  score: number;
  comment: string;
}

export interface VisitResource {
  visitId: string;
  ticketId: string;
  requestedWindowStart: string | null;
  requestedWindowEnd: string | null;
  status: VisitStatus;
  completedAt: string | null;
}

export interface VisitInputResource {
  requestedWindowStart: string;
  requestedWindowEnd: string;
}

export interface AssignmentResource {
  assignmentId: string;
  visitId: string;
  technicianId: string;
  assignedAt: string;
  active: boolean;
}

export interface AssignmentInputResource {
  technicianId: string;
}

export interface DiagnosisResource {
  diagnosisId: string;
  visitId: string;
  summary: string;
  finalCost: number;
  billingReferenceId: string | null;
  createdAt: string;
}

export interface DiagnosisInputResource {
  summary: string;
  finalCost: number;
}

export type ArticleResponse = ArticleResource[];
export type TechnicianResponse = TechnicianResource[];
export type TicketResponse = TicketResource[];
export type ReplyResponse = ReplyResource[];
export type PhotoResponse = PhotoResource[];
export type VisitResponse = VisitResource[];
export type DiagnosisResponse = DiagnosisResource[];
