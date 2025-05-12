from enum import Enum
from typing import List, Optional, Union
from datetime import  date as Date, datetime
from pydantic import BaseModel, ConfigDict

class EDefault(BaseModel):
    pass

class LinkType(str, Enum):
    EvidenceFor = "evidence_for"
    Received = "received"
    Sent = "sent"

class Link(BaseModel):
    model_config = ConfigDict(exclude_unset=True, exclude_none=True)

    id: Optional[str | int] = None
    is_inferred: bool
    source: str | int
    target: str | int
    type: Optional[str] = None

class NodeType(str, Enum):
    Entity = "Entity"
    Event = "Event"
    Relationship = "Relationship"

class SubType(str, Enum):
    AccessPermission = "AccessPermission"
    Assessment = "Assessment"
    Collaborate = "Collaborate"
    Colleagues = "Colleagues"
    Communication = "Communication"
    Coordinates = "Coordinates"
    Criticize = "Criticize"
    Enforcement = "Enforcement"
    Fishing = "Fishing"
    Friends = "Friends"
    Group = "Group"
    HarborReport = "HarborReport"
    Jurisdiction = "Jurisdiction"
    Location = "Location"
    Monitoring = "Monitoring"
    Operates = "Operates"
    Organization = "Organization"
    Person = "Person"
    Reports = "Reports"
    Suspicious = "Suspicious"
    TourActivity = "TourActivity"
    TransponderPing = "TransponderPing"
    Unfriendly = "Unfriendly"
    Vessel = "Vessel"
    VesselMovement = "VesselMovement"

class AssessmentType(str, Enum):
    Documentation = "documentation"
    EnvironmentalAssessment = "environmental assessment"
    SiteSurvey = "site survey"

class EnforcementType(str, Enum):
    EnforcementOperations = "enforcement operations"
    Warnings = "warnings"

class MonitoringType(str, Enum):
    DroneSurveillance = "drone surveillance"
    MiscellaneousMonitoring = "miscellaneous monitoring"
    PatrolActivity = "patrol activity"
    Surveillance = "surveillance"
    WaterQualityTesting = "water quality testing"

class MovementType(str, Enum):
    Departure = "departure"
    Rendezvous = "rendezvous"
    ReturningToPort = "returning to port"

class PermissionType(str, Enum):
    RegularAccess = "regular access"
    Restricted = "restricted"
    SpecialAccess = "special access"


class ReportType(str, Enum):
    DataTransmission = "data transmission"
    EnvironmentalReport = "environmental report"
    OfficialLogs = "official logs"

class ThingCollected(BaseModel):
    type: str
    name: str

class Node(BaseModel):
    model_config = ConfigDict(exclude_unset=True, exclude_none=True)

    type: str
    label: str
    name: Optional[str] = None
    sub_type: str
    id: str
    x: float
    y: float
    timestamp: Optional[datetime] = None
    monitoring_type: Optional[str] = None
    findings: Optional[str] = None
    content: Optional[str] = None
    assessment_type: Optional[str] = None
    results: Optional[str] = None
    movement_type: Optional[str] = None
    destination: Optional[str] = None
    enforcement_type: Optional[str] = None
    outcome: Optional[str] = None
    activity_type: Optional[str] = None
    participants: Optional[int] = None
    thing_collected: Optional[str] = None
    reference: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    friendship_type: Optional[str] = None
    permission_type: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    report_type: Optional[str] = None
    submission_date: Optional[str] = None
    jurisdiction_type: Optional[str] = None
    authority_level: Optional[str] = None
    coordination_type: Optional[str] = None
    operational_role: Optional[str] = None

class Graph(BaseModel):
    mode: str
    edge_default: EDefault
    node_default: EDefault
    name: str


class GraphData(BaseModel):
    directed: bool
    multigraph: bool
    graph: Graph
    nodes: List[Node]
    links: List[Link]