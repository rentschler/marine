export interface GraphData {
  directed: boolean;
  multigraph: boolean;
  graph: Graph;
  nodes: Node[];
  links: Link[];
}

export interface Graph {
  mode: string;
  edge_default: EDefault;
  node_default: EDefault;
  name: string;
}

export interface EDefault {}

export interface Link {
  id?: string;
  is_inferred: boolean;
  source: string;
  target: string;
  type?: LinkType;
}

export enum LinkType {
  EvidenceFor = 'evidence_for',
  Received = 'received',
  Sent = 'sent',
  Missing = 'MISSING',
  Communication = 'Communication',
}

export interface Node {
  type: NodeType;
  label: string;
  name?: string;
  sub_type: SubType;
  id: string;
  timestamp?: Date | null;
  monitoring_type?: MonitoringType;
  findings?: string;
  content?: string;
  assessment_type?: AssessmentType | null;
  results?: null | string;
  movement_type?: MovementType | null;
  destination?: null | string;
  enforcement_type?: EnforcementType;
  outcome?: null | string;
  activity_type?: null | string;
  participants?: number | null;
  thing_collected?: ThingCollected;
  reference?: string;
  date?: Date;
  time?: string;
  friendship_type?: string;
  permission_type?: PermissionType | null;
  start_date?: Date | null;
  end_date?: Date | null;
  report_type?: ReportType | null;
  submission_date?: Date | null;
  jurisdiction_type?: string;
  authority_level?: null | string;
  coordination_type?: null | string;
  operational_role?: null | string;
  x: number;
  y: number;
  subset?: SubsetType;
  community?: string; // Communities this node belongs to
}

export enum SubsetType {
  A = 'A', // only in graph A
  B = 'B', // only in graph B
  A_INTERSECT_B = 'A∩B', // in both graph A and B (intersection)
  A_UNION_B = 'A∪B', // in graph A or B or both (union)
}

export interface DiffNode extends Node {
  subset?: SubsetType;
}

export enum AssessmentType {
  Documentation = 'documentation',
  EnvironmentalAssessment = 'environmental assessment',
  SiteSurvey = 'site survey',
}

export enum EnforcementType {
  EnforcementOperations = 'enforcement operations',
  Warnings = 'warnings',
}

export enum MonitoringType {
  DroneSurveillance = 'drone surveillance',
  MiscellaneousMonitoring = 'miscellaneous monitoring',
  PatrolActivity = 'patrol activity',
  Surveillance = 'surveillance',
  WaterQualityTesting = 'water quality testing',
}

export enum MovementType {
  Departure = 'departure',
  Rendezvous = 'rendezvous',
  ReturningToPort = 'returning to port',
}

export enum PermissionType {
  RegularAccess = 'regular access',
  Restricted = 'restricted',
  SpecialAccess = 'special access',
}

export enum ReportType {
  DataTransmission = 'data transmission',
  EnvironmentalReport = 'environmental report',
  OfficialLogs = 'official logs',
}

export enum SubType {
  AccessPermission = 'AccessPermission',
  Assessment = 'Assessment',
  Collaborate = 'Collaborate',
  Colleagues = 'Colleagues',
  Communication = 'Communication',
  Coordinates = 'Coordinates',
  Criticize = 'Criticize',
  Enforcement = 'Enforcement',
  Fishing = 'Fishing',
  Friends = 'Friends',
  Group = 'Group',
  HarborReport = 'HarborReport',
  Jurisdiction = 'Jurisdiction',
  Location = 'Location',
  Monitoring = 'Monitoring',
  Operates = 'Operates',
  Organization = 'Organization',
  Person = 'Person',
  Reports = 'Reports',
  Suspicious = 'Suspicious',
  TourActivity = 'TourActivity',
  TransponderPing = 'TransponderPing',
  Unfriendly = 'Unfriendly',
  Vessel = 'Vessel',
  VesselMovement = 'VesselMovement',
}

export interface ThingCollected {
  type: string;
  name: string;
}

export enum NodeType {
  Entity = 'Entity',
  Event = 'Event',
  Relationship = 'Relationship',
  Community = 'Community',
  Finding = 'Finding',
  CommunityConnection = 'CommunityConnection',
}

