export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

export interface Personnel {
  id: number;
  name: string;
  phone_code: string | null;
}

export interface Machine {
  id: number;
  machine_number: string;
  model: string | null;
  serial_number: string | null;
  manufacturer: string | null;
  status: 'available' | 'deployed';
  printer_status: 'working' | 'not_working';
}

export interface LogEntry {
  id: number;
  flight_number: string;
  gate_number: string;
  machine_id: number | null;
  machine_number: string;
  manual_machine_number: string | null;
  printer_status?: 'working' | 'not_working';
  guards_count: number;
  installed_by: string;
  installation_time: string;
  removal_time: string | null;
  removed_by: string | null;
  status: 'installed' | 'removed';
}
