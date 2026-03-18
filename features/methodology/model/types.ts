export interface MethodologyDTO {
  organization_id: string;
  name: string;
  text: string;
  team_ids: string[];
}

export interface MethodologyTeam {
  id: number;
  name: string;
  slug: string;
  employee_count: number;
}

export interface MethodologyProps extends MethodologyDTO {
  id: number;
  is_default: boolean;
  teams: MethodologyTeam[];
}
