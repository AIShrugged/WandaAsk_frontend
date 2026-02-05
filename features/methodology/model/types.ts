export interface MethodologyDTO {
  organization_id: string;
  name: string;
  text: string;
  team_ids: string[];
}

export interface MethodologyTeam {
  id: number;
  name: string;
}

export interface MethodologyProps extends MethodologyDTO {
  id: number;
  teams: MethodologyTeam[];
}
