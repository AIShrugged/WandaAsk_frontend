export interface OrganizationProps {
  id: number;
  name: string;
  slug: string;
  pivot: {
    organization_id: number;
    role: string;
    user_id: number;
  };
}

export interface OrganizationDTO {
  name: string;
}
