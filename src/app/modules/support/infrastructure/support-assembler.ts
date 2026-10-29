import { Injectable } from '@angular/core';
import { KnowledgeArticle } from '../domain/model/knowledge-article.entity';
import { ServiceRating } from '../domain/model/service-rating.entity';
import { TechnicianAssignment } from '../domain/model/technician-assignment.entity';
import { Technician } from '../domain/model/technician.entity';
import { TicketPhoto } from '../domain/model/ticket-photo.entity';
import { TicketReply } from '../domain/model/ticket-reply.entity';
import { Ticket } from '../domain/model/ticket.entity';
import { VisitDiagnosis } from '../domain/model/visit-diagnosis.entity';
import { Visit } from '../domain/model/visit.entity';
import {
  ArticleResource,
  AssignmentResource,
  DiagnosisResource,
  PhotoResource,
  RatingResource,
  ReplyResource,
  TechnicianResource,
  TicketResource,
  VisitResource,
} from './support-response';

@Injectable({ providedIn: 'root' })
export class ArticleAssembler {
  toEntityFromResource(resource: ArticleResource): KnowledgeArticle {
    return new KnowledgeArticle({
      id: resource.articleId,
      title: resource.title,
      category: resource.category,
      contentReference: resource.contentReference,
      publishedAt: resource.publishedAt,
      active: resource.active,
    });
  }

  toEntitiesFromResponse(resources: ArticleResource[]): KnowledgeArticle[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}

@Injectable({ providedIn: 'root' })
export class TechnicianAssembler {
  toEntityFromResource(resource: TechnicianResource): Technician {
    return new Technician({
      id: resource.technicianId,
      fullName: resource.fullName,
      accreditationCode: resource.accreditationCode,
      email: resource.email,
      phone: resource.phone,
      available: resource.available,
      active: resource.active,
    });
  }

  toEntitiesFromResponse(resources: TechnicianResource[]): Technician[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}

@Injectable({ providedIn: 'root' })
export class TicketAssembler {
  toEntityFromResource(resource: TicketResource): Ticket {
    return new Ticket({
      id: resource.ticketId,
      principalAccountId: resource.principalAccountId,
      meterId: resource.meterId,
      subject: resource.subject,
      message: resource.message,
      status: resource.status,
      createdAt: resource.createdAt,
      resolvedAt: resource.resolvedAt,
      closedAt: resource.closedAt,
    });
  }

  toEntitiesFromResponse(resources: TicketResource[]): Ticket[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}

@Injectable({ providedIn: 'root' })
export class ReplyAssembler {
  toEntityFromResource(resource: ReplyResource): TicketReply {
    return new TicketReply({
      id: resource.replyId,
      ticketId: resource.ticketId,
      authorAccountId: resource.authorAccountId,
      body: resource.body,
      postedAt: resource.postedAt,
    });
  }

  toEntitiesFromResponse(resources: ReplyResource[]): TicketReply[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}

@Injectable({ providedIn: 'root' })
export class PhotoAssembler {
  toEntityFromResource(resource: PhotoResource): TicketPhoto {
    return new TicketPhoto({
      id: resource.photoId,
      ticketId: resource.ticketId,
      objectReference: resource.objectReference,
      uploadedByAccountId: resource.uploadedByAccountId,
      uploadedAt: resource.uploadedAt,
    });
  }

  toEntitiesFromResponse(resources: PhotoResource[]): TicketPhoto[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}

@Injectable({ providedIn: 'root' })
export class RatingAssembler {
  toEntityFromResource(resource: RatingResource): ServiceRating {
    return new ServiceRating({
      id: resource.ratingId,
      ticketId: resource.ticketId,
      score: resource.score,
      comment: resource.comment ?? '',
      ratedAt: resource.ratedAt,
    });
  }
}

@Injectable({ providedIn: 'root' })
export class VisitAssembler {
  toEntityFromResource(resource: VisitResource): Visit {
    return new Visit({
      id: resource.visitId,
      ticketId: resource.ticketId,
      requestedWindowStart: resource.requestedWindowStart,
      requestedWindowEnd: resource.requestedWindowEnd,
      status: resource.status,
      completedAt: resource.completedAt,
    });
  }

  toEntitiesFromResponse(resources: VisitResource[]): Visit[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}

@Injectable({ providedIn: 'root' })
export class AssignmentAssembler {
  toEntityFromResource(resource: AssignmentResource): TechnicianAssignment {
    return new TechnicianAssignment({
      id: resource.assignmentId,
      visitId: resource.visitId,
      technicianId: resource.technicianId,
      assignedAt: resource.assignedAt,
      active: resource.active,
    });
  }
}

@Injectable({ providedIn: 'root' })
export class DiagnosisAssembler {
  toEntityFromResource(resource: DiagnosisResource): VisitDiagnosis {
    return new VisitDiagnosis({
      id: resource.diagnosisId,
      visitId: resource.visitId,
      summary: resource.summary,
      finalCost: resource.finalCost,
      billingReferenceId: resource.billingReferenceId,
      createdAt: resource.createdAt,
    });
  }
}
