export interface MethodologyDTO {
  organization_id: string;
  name: string;
  text: string;
}

export interface MethodologyProps extends MethodologyDTO {
  id: number;
  teams: number[];
}
