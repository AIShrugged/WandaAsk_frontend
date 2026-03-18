export interface OrganizationProps {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  pivot: {
    organization_id: number;
    role: string;
    user_id: number;
  };
}

export interface OrganizationDTO {
  name: string;
}
