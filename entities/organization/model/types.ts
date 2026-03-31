export interface OrganizationIssueType {
  id: number;
  organization_id: number | null;
  key: string;
  name: string;
  base_type: string;
  agent_profile_id: number | null;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  agent_profile?: {
    id: number;
    name: string;
  } | null;
}

export interface OrganizationIssueTypePayload {
  key: string;
  name: string;
  base_type: 'development' | 'organization';
  agent_profile_id: number | null;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface OrganizationProps {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  issue_types?: OrganizationIssueType[];
  pivot: {
    organization_id: number;
    role: string;
    user_id: number;
  };
}

export interface OrganizationDTO {
  name: string;
}

export interface OrganizationUpdateDTO {
  name?: string;
  slug?: string;
  issue_types?: OrganizationIssueTypePayload[];
}
