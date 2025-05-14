export interface FilterRequestBody {
  filterEntitys: number;
  
  showEvents: boolean;
  showRelations: boolean;
  showEvidenceFor: boolean;
  showReceived: boolean;
  showSent: boolean;
  showNull: boolean;
  
  minDegree?: number;
  maxDegree?: number;
  type?: string[];
  monitoring_type?: string[];
  findings?: string[];
  content?: string[];
  assessment_type?: string[];
  results?: string[];
  movement_type?: string[];
  destination?: string[];
  enforcement_type?: string[];
  outcome?: string[];
  activity_type?: string[];
  participants?: number[];
  thing_collected?: string[];
  reference?: string[];
  date?: string[];
  time?: string[];
  friendship_type?: string[];
  permission_type?: string[];
  start_date?: string[];
  end_date?: string[];
  report_type?: string[];
  submission_date?: string[];
  jurisdiction_type?: string[];
  authority_level?: string[];
  coordination_type?: string[];
  operational_role?: string[];
} 