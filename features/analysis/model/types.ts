export interface AnalysisProps {
  total: {
    current_value: number;
    max_value: number;
    min_value: number;
    display_name: string;
    frontend_component_type: string;
  };
  conclusion: {
    display_name: string;
    frontend_component_type: string;
    value: ConclusionItemProps[];
  };
  metrics: MetricGroup[];
}

export interface ConclusionItemProps {
  display_name: string;
  value: string[];
}

export interface MetricGroup {
  current_value: number;
  display_name: string;
  frontend_component_type: string;
  max_value: number;
  min_value: number;
  submetrics: MetricItem[];
}

export interface MetricItem {
  current_value: number;
  display_name: string;
  frontend_component_type: string;
  max_value: number;
  min_value: number;
}
