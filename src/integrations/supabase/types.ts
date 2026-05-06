// export type Json =
//   | string
//   | number
//   | boolean
//   | null
//   | { [key: string]: Json | undefined }
//   | Json[]

// export type Database = {
//   // Allows to automatically instantiate createClient with right options
//   // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
//   __InternalSupabase: {
//     PostgrestVersion: "14.5"
//   }
//   public: {
//     Tables: {
//       appointments: {
//         Row: {
//           created_at: string | null
//           doctor_id: string | null
//           id: string
//           notes: string | null
//           patient_id: string | null
//           scheduled_at: string
//           status: string | null
//         }
//         Insert: {
//           created_at?: string | null
//           doctor_id?: string | null
//           id?: string
//           notes?: string | null
//           patient_id?: string | null
//           scheduled_at: string
//           status?: string | null
//         }
//         Update: {
//           created_at?: string | null
//           doctor_id?: string | null
//           id?: string
//           notes?: string | null
//           patient_id?: string | null
//           scheduled_at?: string
//           status?: string | null
//         }
//         Relationships: [
//           {
//             foreignKeyName: "appointments_doctor_id_fkey"
//             columns: ["doctor_id"]
//             isOneToOne: false
//             referencedRelation: "doctors"
//             referencedColumns: ["id"]
//           },
//           {
//             foreignKeyName: "appointments_patient_id_fkey"
//             columns: ["patient_id"]
//             isOneToOne: false
//             referencedRelation: "patients"
//             referencedColumns: ["id"]
//           },
//         ]
//       }
//       beds: {
//         Row: {
//           bed_number: string
//           created_at: string | null
//           floor: number | null
//           id: string
//           patient_id: string | null
//           status: string | null
//           ward: string
//         }
//         Insert: {
//           bed_number: string
//           created_at?: string | null
//           floor?: number | null
//           id?: string
//           patient_id?: string | null
//           status?: string | null
//           ward: string
//         }
//         Update: {
//           bed_number?: string
//           created_at?: string | null
//           floor?: number | null
//           id?: string
//           patient_id?: string | null
//           status?: string | null
//           ward?: string
//         }
//         Relationships: [
//           {
//             foreignKeyName: "beds_patient_id_fkey"
//             columns: ["patient_id"]
//             isOneToOne: false
//             referencedRelation: "patients"
//             referencedColumns: ["id"]
//           },
//         ]
//       }
//       departments: {
//         Row: {
//           created_at: string | null
//           head_doctor_id: string | null
//           id: string
//           name: string
//         }
//         Insert: {
//           created_at?: string | null
//           head_doctor_id?: string | null
//           id?: string
//           name: string
//         }
//         Update: {
//           created_at?: string | null
//           head_doctor_id?: string | null
//           id?: string
//           name?: string
//         }
//         Relationships: []
//       }
//       doctors: {
//         Row: {
//           consultation_fee: number | null
//           created_at: string | null
//           dept_id: string | null
//           id: string
//           is_available: boolean | null
//           name: string
//           qualification: string | null
//           user_id: string | null
//         }
//         Insert: {
//           consultation_fee?: number | null
//           created_at?: string | null
//           dept_id?: string | null
//           id?: string
//           is_available?: boolean | null
//           name: string
//           qualification?: string | null
//           user_id?: string | null
//         }
//         Update: {
//           consultation_fee?: number | null
//           created_at?: string | null
//           dept_id?: string | null
//           id?: string
//           is_available?: boolean | null
//           name?: string
//           qualification?: string | null
//           user_id?: string | null
//         }
//         Relationships: [
//           {
//             foreignKeyName: "doctors_dept_id_fkey"
//             columns: ["dept_id"]
//             isOneToOne: false
//             referencedRelation: "departments"
//             referencedColumns: ["id"]
//           },
//         ]
//       }
//       drugs: {
//         Row: {
//           category: string | null
//           created_at: string | null
//           expiry_date: string | null
//           id: string
//           name: string
//           price: number | null
//           reorder_level: number | null
//           stock_qty: number | null
//         }
//         Insert: {
//           category?: string | null
//           created_at?: string | null
//           expiry_date?: string | null
//           id?: string
//           name: string
//           price?: number | null
//           reorder_level?: number | null
//           stock_qty?: number | null
//         }
//         Update: {
//           category?: string | null
//           created_at?: string | null
//           expiry_date?: string | null
//           id?: string
//           name?: string
//           price?: number | null
//           reorder_level?: number | null
//           stock_qty?: number | null
//         }
//         Relationships: []
//       }
//       hospitals: {
//         Row: {
//           accreditation: string | null
//           address: string | null
//           city: string | null
//           country: string | null
//           created_at: string | null
//           created_by: string | null
//           description: string | null
//           email: string | null
//           established_year: number | null
//           hospital_type: string | null
//           id: string
//           logo_url: string | null
//           name: string
//           phone: string | null
//           pincode: string | null
//           registration_no: string | null
//           state: string | null
//           total_beds: number | null
//           updated_at: string | null
//           website: string | null
//           working_hours: string | null
//         }
//         Insert: {
//           accreditation?: string | null
//           address?: string | null
//           city?: string | null
//           country?: string | null
//           created_at?: string | null
//           created_by?: string | null
//           description?: string | null
//           email?: string | null
//           established_year?: number | null
//           hospital_type?: string | null
//           id?: string
//           logo_url?: string | null
//           name: string
//           phone?: string | null
//           pincode?: string | null
//           registration_no?: string | null
//           state?: string | null
//           total_beds?: number | null
//           updated_at?: string | null
//           website?: string | null
//           working_hours?: string | null
//         }
//         Update: {
//           accreditation?: string | null
//           address?: string | null
//           city?: string | null
//           country?: string | null
//           created_at?: string | null
//           created_by?: string | null
//           description?: string | null
//           email?: string | null
//           established_year?: number | null
//           hospital_type?: string | null
//           id?: string
//           logo_url?: string | null
//           name?: string
//           phone?: string | null
//           pincode?: string | null
//           registration_no?: string | null
//           state?: string | null
//           total_beds?: number | null
//           updated_at?: string | null
//           website?: string | null
//           working_hours?: string | null
//         }
//         Relationships: []
//       }
//       invoice_items: {
//         Row: {
//           amount: number
//           category: string | null
//           created_at: string | null
//           description: string
//           id: string
//           invoice_id: string
//           quantity: number
//           rate: number
//         }
//         Insert: {
//           amount?: number
//           category?: string | null
//           created_at?: string | null
//           description: string
//           id?: string
//           invoice_id: string
//           quantity?: number
//           rate?: number
//         }
//         Update: {
//           amount?: number
//           category?: string | null
//           created_at?: string | null
//           description?: string
//           id?: string
//           invoice_id?: string
//           quantity?: number
//           rate?: number
//         }
//         Relationships: []
//       }
//       invoices: {
//         Row: {
//           created_at: string | null
//           id: string
//           paid_amount: number | null
//           status: string | null
//           total_amount: number | null
//           visit_id: string | null
//         }
//         Insert: {
//           created_at?: string | null
//           id?: string
//           paid_amount?: number | null
//           status?: string | null
//           total_amount?: number | null
//           visit_id?: string | null
//         }
//         Update: {
//           created_at?: string | null
//           id?: string
//           paid_amount?: number | null
//           status?: string | null
//           total_amount?: number | null
//           visit_id?: string | null
//         }
//         Relationships: [
//           {
//             foreignKeyName: "invoices_visit_id_fkey"
//             columns: ["visit_id"]
//             isOneToOne: false
//             referencedRelation: "visits"
//             referencedColumns: ["id"]
//           },
//         ]
//       }
//       lab_orders: {
//         Row: {
//           created_at: string | null
//           id: string
//           report_url: string | null
//           result: string | null
//           result_at: string | null
//           status: string | null
//           test_name: string
//           visit_id: string | null
//         }
//         Insert: {
//           created_at?: string | null
//           id?: string
//           report_url?: string | null
//           result?: string | null
//           result_at?: string | null
//           status?: string | null
//           test_name: string
//           visit_id?: string | null
//         }
//         Update: {
//           created_at?: string | null
//           id?: string
//           report_url?: string | null
//           result?: string | null
//           result_at?: string | null
//           status?: string | null
//           test_name?: string
//           visit_id?: string | null
//         }
//         Relationships: [
//           {
//             foreignKeyName: "lab_orders_visit_id_fkey"
//             columns: ["visit_id"]
//             isOneToOne: false
//             referencedRelation: "visits"
//             referencedColumns: ["id"]
//           },
//         ]
//       }
//       patients: {
//         Row: {
//           address: string | null
//           allergies: string | null
//           blood_group: string | null
//           created_at: string | null
//           dob: string | null
//           emergency_contact: string | null
//           gender: string | null
//           id: string
//           name: string
//           patient_code: string
//           phone: string
//           photo_url: string | null
//           user_id: string | null
//         }
//         Insert: {
//           address?: string | null
//           allergies?: string | null
//           blood_group?: string | null
//           created_at?: string | null
//           dob?: string | null
//           emergency_contact?: string | null
//           gender?: string | null
//           id?: string
//           name: string
//           patient_code: string
//           phone: string
//           photo_url?: string | null
//           user_id?: string | null
//         }
//         Update: {
//           address?: string | null
//           allergies?: string | null
//           blood_group?: string | null
//           created_at?: string | null
//           dob?: string | null
//           emergency_contact?: string | null
//           gender?: string | null
//           id?: string
//           name?: string
//           patient_code?: string
//           phone?: string
//           photo_url?: string | null
//           user_id?: string | null
//         }
//         Relationships: []
//       }
//       payments: {
//         Row: {
//           amount: number
//           id: string
//           invoice_id: string | null
//           method: string | null
//           paid_at: string | null
//         }
//         Insert: {
//           amount: number
//           id?: string
//           invoice_id?: string | null
//           method?: string | null
//           paid_at?: string | null
//         }
//         Update: {
//           amount?: number
//           id?: string
//           invoice_id?: string | null
//           method?: string | null
//           paid_at?: string | null
//         }
//         Relationships: [
//           {
//             foreignKeyName: "payments_invoice_id_fkey"
//             columns: ["invoice_id"]
//             isOneToOne: false
//             referencedRelation: "invoices"
//             referencedColumns: ["id"]
//           },
//         ]
//       }
//       prescriptions: {
//         Row: {
//           created_at: string | null
//           id: string
//           instructions: string | null
//           medications: Json
//           visit_id: string | null
//         }
//         Insert: {
//           created_at?: string | null
//           id?: string
//           instructions?: string | null
//           medications: Json
//           visit_id?: string | null
//         }
//         Update: {
//           created_at?: string | null
//           id?: string
//           instructions?: string | null
//           medications?: Json
//           visit_id?: string | null
//         }
//         Relationships: [
//           {
//             foreignKeyName: "prescriptions_visit_id_fkey"
//             columns: ["visit_id"]
//             isOneToOne: false
//             referencedRelation: "visits"
//             referencedColumns: ["id"]
//           },
//         ]
//       }
//       profiles: {
//         Row: {
//           avatar_url: string | null
//           created_at: string | null
//           email: string | null
//           full_name: string | null
//           id: string
//         }
//         Insert: {
//           avatar_url?: string | null
//           created_at?: string | null
//           email?: string | null
//           full_name?: string | null
//           id: string
//         }
//         Update: {
//           avatar_url?: string | null
//           created_at?: string | null
//           email?: string | null
//           full_name?: string | null
//           id?: string
//         }
//         Relationships: []
//       }
//       radiology_orders: {
//         Row: {
//           created_at: string | null
//           id: string
//           radiologist_notes: string | null
//           report_url: string | null
//           service_name: string
//           status: string | null
//           visit_id: string | null
//         }
//         Insert: {
//           created_at?: string | null
//           id?: string
//           radiologist_notes?: string | null
//           report_url?: string | null
//           service_name: string
//           status?: string | null
//           visit_id?: string | null
//         }
//         Update: {
//           created_at?: string | null
//           id?: string
//           radiologist_notes?: string | null
//           report_url?: string | null
//           service_name?: string
//           status?: string | null
//           visit_id?: string | null
//         }
//         Relationships: [
//           {
//             foreignKeyName: "radiology_orders_visit_id_fkey"
//             columns: ["visit_id"]
//             isOneToOne: false
//             referencedRelation: "visits"
//             referencedColumns: ["id"]
//           },
//         ]
//       }
//       staff: {
//         Row: {
//           created_at: string | null
//           dept_id: string | null
//           id: string
//           is_active: boolean | null
//           name: string
//           phone: string | null
//           role: string
//           user_id: string | null
//         }
//         Insert: {
//           created_at?: string | null
//           dept_id?: string | null
//           id?: string
//           is_active?: boolean | null
//           name: string
//           phone?: string | null
//           role: string
//           user_id?: string | null
//         }
//         Update: {
//           created_at?: string | null
//           dept_id?: string | null
//           id?: string
//           is_active?: boolean | null
//           name?: string
//           phone?: string | null
//           role?: string
//           user_id?: string | null
//         }
//         Relationships: [
//           {
//             foreignKeyName: "staff_dept_id_fkey"
//             columns: ["dept_id"]
//             isOneToOne: false
//             referencedRelation: "departments"
//             referencedColumns: ["id"]
//           },
//         ]
//       }
//       user_roles: {
//         Row: {
//           id: string
//           role: Database["public"]["Enums"]["app_role"]
//           user_id: string
//         }
//         Insert: {
//           id?: string
//           role: Database["public"]["Enums"]["app_role"]
//           user_id: string
//         }
//         Update: {
//           id?: string
//           role?: Database["public"]["Enums"]["app_role"]
//           user_id?: string
//         }
//         Relationships: []
//       }
//       visits: {
//         Row: {
//           chief_complaint: string | null
//           created_at: string | null
//           diagnosis: string | null
//           doctor_id: string | null
//           icd_code: string | null
//           id: string
//           notes: string | null
//           patient_id: string | null
//           status: string | null
//           token_number: number | null
//           visit_date: string | null
//           visit_type: string | null
//           vitals: Json | null
//         }
//         Insert: {
//           chief_complaint?: string | null
//           created_at?: string | null
//           diagnosis?: string | null
//           doctor_id?: string | null
//           icd_code?: string | null
//           id?: string
//           notes?: string | null
//           patient_id?: string | null
//           status?: string | null
//           token_number?: number | null
//           visit_date?: string | null
//           visit_type?: string | null
//           vitals?: Json | null
//         }
//         Update: {
//           chief_complaint?: string | null
//           created_at?: string | null
//           diagnosis?: string | null
//           doctor_id?: string | null
//           icd_code?: string | null
//           id?: string
//           notes?: string | null
//           patient_id?: string | null
//           status?: string | null
//           token_number?: number | null
//           visit_date?: string | null
//           visit_type?: string | null
//           vitals?: Json | null
//         }
//         Relationships: [
//           {
//             foreignKeyName: "visits_doctor_id_fkey"
//             columns: ["doctor_id"]
//             isOneToOne: false
//             referencedRelation: "doctors"
//             referencedColumns: ["id"]
//           },
//           {
//             foreignKeyName: "visits_patient_id_fkey"
//             columns: ["patient_id"]
//             isOneToOne: false
//             referencedRelation: "patients"
//             referencedColumns: ["id"]
//           },
//         ]
//       }
//     }
//     Views: {
//       [_ in never]: never
//     }
//     Functions: {
//       claim_first_admin: { Args: never; Returns: boolean }
//       has_role: {
//         Args: {
//           _role: Database["public"]["Enums"]["app_role"]
//           _user_id: string
//         }
//         Returns: boolean
//       }
//       is_staff: { Args: { _user_id: string }; Returns: boolean }
//     }
//     Enums: {
//       app_role:
//         | "super_admin"
//         | "doctor"
//         | "nurse"
//         | "receptionist"
//         | "lab_technician"
//         | "radiologist"
//         | "pharmacist"
//         | "billing_staff"
//         | "patient"
//     }
//     CompositeTypes: {
//       [_ in never]: never
//     }
//   }
// }

// type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

// type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

// export type Tables<
//   DefaultSchemaTableNameOrOptions extends
//     | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
//     | { schema: keyof DatabaseWithoutInternals },
//   TableName extends DefaultSchemaTableNameOrOptions extends {
//     schema: keyof DatabaseWithoutInternals
//   }
//     ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
//         DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
//     : never = never,
// > = DefaultSchemaTableNameOrOptions extends {
//   schema: keyof DatabaseWithoutInternals
// }
//   ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
//       DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
//       Row: infer R
//     }
//     ? R
//     : never
//   : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
//         DefaultSchema["Views"])
//     ? (DefaultSchema["Tables"] &
//         DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
//         Row: infer R
//       }
//       ? R
//       : never
//     : never

// export type TablesInsert<
//   DefaultSchemaTableNameOrOptions extends
//     | keyof DefaultSchema["Tables"]
//     | { schema: keyof DatabaseWithoutInternals },
//   TableName extends DefaultSchemaTableNameOrOptions extends {
//     schema: keyof DatabaseWithoutInternals
//   }
//     ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
//     : never = never,
// > = DefaultSchemaTableNameOrOptions extends {
//   schema: keyof DatabaseWithoutInternals
// }
//   ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
//       Insert: infer I
//     }
//     ? I
//     : never
//   : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
//     ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
//         Insert: infer I
//       }
//       ? I
//       : never
//     : never

// export type TablesUpdate<
//   DefaultSchemaTableNameOrOptions extends
//     | keyof DefaultSchema["Tables"]
//     | { schema: keyof DatabaseWithoutInternals },
//   TableName extends DefaultSchemaTableNameOrOptions extends {
//     schema: keyof DatabaseWithoutInternals
//   }
//     ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
//     : never = never,
// > = DefaultSchemaTableNameOrOptions extends {
//   schema: keyof DatabaseWithoutInternals
// }
//   ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
//       Update: infer U
//     }
//     ? U
//     : never
//   : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
//     ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
//         Update: infer U
//       }
//       ? U
//       : never
//     : never

// export type Enums<
//   DefaultSchemaEnumNameOrOptions extends
//     | keyof DefaultSchema["Enums"]
//     | { schema: keyof DatabaseWithoutInternals },
//   EnumName extends DefaultSchemaEnumNameOrOptions extends {
//     schema: keyof DatabaseWithoutInternals
//   }
//     ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
//     : never = never,
// > = DefaultSchemaEnumNameOrOptions extends {
//   schema: keyof DatabaseWithoutInternals
// }
//   ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
//   : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
//     ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
//     : never

// export type CompositeTypes<
//   PublicCompositeTypeNameOrOptions extends
//     | keyof DefaultSchema["CompositeTypes"]
//     | { schema: keyof DatabaseWithoutInternals },
//   CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
//     schema: keyof DatabaseWithoutInternals
//   }
//     ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
//     : never = never,
// > = PublicCompositeTypeNameOrOptions extends {
//   schema: keyof DatabaseWithoutInternals
// }
//   ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
//   : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
//     ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
//     : never

// export const Constants = {
//   public: {
//     Enums: {
//       app_role: [
//         "super_admin",
//         "doctor",
//         "nurse",
//         "receptionist",
//         "lab_technician",
//         "radiologist",
//         "pharmacist",
//         "billing_staff",
//         "patient",
//       ],
//     },
//   },
// } as const








// new type.ts 



// ============================================================
// HMS — Database Types (auto-generated from migration)
// ============================================================

export type AppRole =
  | 'super_admin'
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'lab_technician'
  | 'radiologist'
  | 'pharmacist'
  | 'billing_staff'
  | 'patient';

// ============================================================
// AUTH / PROFILES
// ============================================================

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

// ============================================================
// HOSPITALS
// ============================================================

export interface Hospital {
  id: string;
  name: string;
  registration_no: string | null;
  hospital_type: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string;
  total_beds: number;
  established_year: number | null;
  accreditation: string | null;
  working_hours: string | null;
  logo_url: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type HospitalInsert = Omit<Hospital, 'id' | 'created_at' | 'updated_at'>;
export type HospitalUpdate = Partial<HospitalInsert>;

// ============================================================
// DEPARTMENTS
// ============================================================

export interface Department {
  id: string;
  name: string;
  head_doctor_id: string | null;
  hospital_id: string | null;
  created_at: string;
}

export type DepartmentInsert = Omit<Department, 'id' | 'created_at'>;
export type DepartmentUpdate = Partial<DepartmentInsert>;

// ============================================================
// DOCTORS
// ============================================================

export interface Doctor {
  id: string;
  user_id: string | null;
  dept_id: string | null;
  name: string;
  qualification: string | null;
  consultation_fee: number;
  is_available: boolean;
  hospital_id: string | null;
  created_at: string;
}

export type DoctorInsert = Omit<Doctor, 'id' | 'created_at'>;
export type DoctorUpdate = Partial<DoctorInsert>;

// ============================================================
// PATIENTS
// ============================================================

export interface Patient {
  id: string;
  user_id: string | null;
  patient_code: string;
  name: string;
  dob: string | null;           // ISO date string
  gender: string | null;
  blood_group: string | null;
  phone: string;
  address: string | null;
  emergency_contact: string | null;
  allergies: string | null;
  photo_url: string | null;
  hospital_id: string | null;
  created_at: string;
}

export type PatientInsert = Omit<Patient, 'id' | 'patient_code' | 'created_at'>;
export type PatientUpdate = Partial<PatientInsert>;

// ============================================================
// APPOINTMENTS
// ============================================================

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  patient_id: string | null;
  doctor_id: string | null;
  scheduled_at: string;
  status: AppointmentStatus | string;
  notes: string | null;
  created_at: string;
}

export type AppointmentInsert = Omit<Appointment, 'id' | 'created_at'>;
export type AppointmentUpdate = Partial<AppointmentInsert>;

// ============================================================
// VISITS
// ============================================================

export type VisitType = 'OPD' | 'IPD' | 'Emergency' | 'Teleconsult';
export type VisitStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled';

export interface Vitals {
  bp_systolic?: number;
  bp_diastolic?: number;
  pulse?: number;
  temperature?: number;
  spo2?: number;
  respiratory_rate?: number;
  weight?: number;
  height?: number;
  blood_glucose?: number;
  [key: string]: unknown;
}

export interface Visit {
  id: string;
  patient_id: string | null;
  doctor_id: string | null;
  visit_date: string;           // ISO date string
  visit_type: VisitType | string;
  status: VisitStatus | string;
  token_number: number | null;
  chief_complaint: string | null;
  diagnosis: string | null;
  icd_code: string | null;
  vitals: Vitals | null;
  notes: string | null;
  created_at: string;
}

export type VisitInsert = Omit<Visit, 'id' | 'created_at'>;
export type VisitUpdate = Partial<VisitInsert>;

// ============================================================
// CLINICAL ORDERS
// ============================================================

export type LabOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface LabOrder {
  id: string;
  visit_id: string | null;
  test_name: string;
  status: LabOrderStatus | string;
  result: string | null;
  result_at: string | null;
  report_url: string | null;
  created_at: string;
}

export type LabOrderInsert = Omit<LabOrder, 'id' | 'created_at'>;
export type LabOrderUpdate = Partial<LabOrderInsert>;

export type RadiologyOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface RadiologyOrder {
  id: string;
  visit_id: string | null;
  service_name: string;
  status: RadiologyOrderStatus | string;
  report_url: string | null;
  radiologist_notes: string | null;
  created_at: string;
}

export type RadiologyOrderInsert = Omit<RadiologyOrder, 'id' | 'created_at'>;
export type RadiologyOrderUpdate = Partial<RadiologyOrderInsert>;

export interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface Prescription {
  id: string;
  visit_id: string | null;
  medications: MedicationItem[];
  instructions: string | null;
  created_at: string;
}

export type PrescriptionInsert = Omit<Prescription, 'id' | 'created_at'>;
export type PrescriptionUpdate = Partial<PrescriptionInsert>;

// ============================================================
// PHARMACY & BEDS
// ============================================================

export interface Drug {
  id: string;
  name: string;
  category: string | null;
  stock_qty: number;
  price: number | null;
  expiry_date: string | null;   // ISO date string
  reorder_level: number;
  created_at: string;
}

export type DrugInsert = Omit<Drug, 'id' | 'created_at'>;
export type DrugUpdate = Partial<DrugInsert>;

export type BedStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';

export interface Bed {
  id: string;
  ward: string;
  floor: number | null;
  bed_number: string;
  status: BedStatus | string;
  patient_id: string | null;
  hospital_id: string | null;
  created_at: string;
}

export type BedInsert = Omit<Bed, 'id' | 'created_at'>;
export type BedUpdate = Partial<BedInsert>;

// ============================================================
// BILLING
// ============================================================

export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled';

export interface Invoice {
  id: string;
  visit_id: string | null;
  hospital_id: string | null;
  total_amount: number;
  paid_amount: number;
  status: InvoiceStatus | string;
  created_at: string;
}

export type InvoiceInsert = Omit<Invoice, 'id' | 'created_at'>;
export type InvoiceUpdate = Partial<InvoiceInsert>;

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  category: string | null;
  quantity: number;
  rate: number;
  amount: number;
  created_at: string;
}

export type InvoiceItemInsert = Omit<InvoiceItem, 'id' | 'created_at'>;
export type InvoiceItemUpdate = Partial<InvoiceItemInsert>;

export interface Payment {
  id: string;
  invoice_id: string | null;
  amount: number;
  method: string | null;
  paid_at: string;
}

export type PaymentInsert = Omit<Payment, 'id' | 'paid_at'>;

// ============================================================
// STAFF
// ============================================================

export interface Staff {
  id: string;
  user_id: string | null;
  name: string;
  role: string;
  phone: string | null;
  dept_id: string | null;
  hospital_id: string | null;
  is_active: boolean;
  created_at: string;
}

export type StaffInsert = Omit<Staff, 'id' | 'created_at'>;
export type StaffUpdate = Partial<StaffInsert>;

// ============================================================
// SERVICE CATALOG
// ============================================================

export interface ServiceCatalog {
  id: string;
  hospital_id: string | null;
  category: string;
  service_name: string;
  service_code: string | null;
  rate: number;
  tax_percent: number;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type ServiceCatalogInsert = Omit<ServiceCatalog, 'id' | 'created_at' | 'updated_at'>;
export type ServiceCatalogUpdate = Partial<ServiceCatalogInsert>;

// ============================================================
// OPD QUEUE
// ============================================================

export type OpdQueueStatus = 'waiting' | 'called' | 'in_progress' | 'completed' | 'skipped';

export interface OpdQueue {
  id: string;
  hospital_id: string | null;
  visit_id: string | null;
  patient_id: string | null;
  doctor_id: string | null;
  dept_id: string | null;
  token_number: number;
  queue_date: string;           // ISO date string
  status: OpdQueueStatus | string;
  called_at: string | null;
  completed_at: string | null;
  estimated_wait_mins: number | null;
  created_at: string;
}

export type OpdQueueInsert = Omit<OpdQueue, 'id' | 'created_at'>;
export type OpdQueueUpdate = Partial<OpdQueueInsert>;

// ============================================================
// TRIAGE / EMERGENCY
// ============================================================

export type TriageLevel = 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
export type ArrivalMode = 'walk_in' | 'ambulance' | 'referred' | 'police';

export interface TriageRecord {
  id: string;
  hospital_id: string | null;
  patient_id: string | null;
  visit_id: string | null;
  triage_level: TriageLevel | string;
  chief_complaint: string | null;
  arrival_mode: ArrivalMode | string;
  arrival_time: string;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  pulse: number | null;
  temperature: number | null;
  spo2: number | null;
  gcs_score: number | null;
  pain_score: number | null;   // 0–10
  allergies: string | null;
  notes: string | null;
  triaged_by: string | null;
  status: string;
  created_at: string;
}

export type TriageRecordInsert = Omit<TriageRecord, 'id' | 'created_at'>;
export type TriageRecordUpdate = Partial<TriageRecordInsert>;

// ============================================================
// IPD ADMISSIONS
// ============================================================

export type AdmissionStatus = 'admitted' | 'discharged' | 'transferred' | 'absconded';
export type AdmissionType = 'planned' | 'emergency' | 'transfer';
export type DischargeType = 'regular' | 'lama' | 'referred' | 'death' | 'absconded';

export interface IpdAdmission {
  id: string;
  hospital_id: string | null;
  patient_id: string | null;
  visit_id: string | null;
  admitting_doctor_id: string | null;
  bed_id: string | null;
  dept_id: string | null;
  admission_no: string | null;
  admission_date: string;
  admission_type: AdmissionType | string;
  provisional_diagnosis: string | null;
  admission_notes: string | null;
  diet_instructions: string | null;
  discharge_date: string | null;
  discharge_type: DischargeType | string | null;
  discharge_summary: string | null;
  status: AdmissionStatus | string;
  created_at: string;
  updated_at: string;
}

export type IpdAdmissionInsert = Omit<IpdAdmission, 'id' | 'admission_no' | 'created_at' | 'updated_at'>;
export type IpdAdmissionUpdate = Partial<IpdAdmissionInsert>;

// ============================================================
// VITALS, NURSING NOTES, WARD ROUNDS
// ============================================================

export interface VitalsRecord {
  id: string;
  patient_id: string | null;
  visit_id: string | null;
  admission_id: string | null;
  recorded_by: string | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  pulse: number | null;
  temperature: number | null;
  spo2: number | null;
  respiratory_rate: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;           // generated column, read-only
  blood_glucose: number | null;
  notes: string | null;
  recorded_at: string;
}

export type VitalsRecordInsert = Omit<VitalsRecord, 'id' | 'bmi' | 'recorded_at'>;
export type VitalsRecordUpdate = Partial<VitalsRecordInsert>;

export interface NursingNote {
  id: string;
  admission_id: string | null;
  patient_id: string | null;
  nurse_id: string | null;
  note_type: string;
  note: string;
  shift: string | null;
  created_at: string;
}

export type NursingNoteInsert = Omit<NursingNote, 'id' | 'created_at'>;
export type NursingNoteUpdate = Partial<NursingNoteInsert>;

export interface WardRound {
  id: string;
  admission_id: string | null;
  patient_id: string | null;
  doctor_id: string | null;
  round_date: string;
  observations: string | null;
  treatment_plan: string | null;
  investigations_ordered: string | null;
  diet_instructions: string | null;
  next_review_date: string | null;
  created_at: string;
}

export type WardRoundInsert = Omit<WardRound, 'id' | 'created_at'>;
export type WardRoundUpdate = Partial<WardRoundInsert>;

// ============================================================
// DOCTOR SCHEDULES & LEAVES
// ============================================================

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DoctorSchedule {
  id: string;
  doctor_id: string | null;
  hospital_id: string | null;
  day_of_week: DayOfWeek;
  start_time: string;           // HH:MM:SS
  end_time: string;             // HH:MM:SS
  slot_duration_minutes: number;
  max_patients: number;
  is_active: boolean;
  created_at: string;
}

export type DoctorScheduleInsert = Omit<DoctorSchedule, 'id' | 'created_at'>;
export type DoctorScheduleUpdate = Partial<DoctorScheduleInsert>;

export interface DoctorLeave {
  id: string;
  doctor_id: string | null;
  leave_date: string;           // ISO date string
  reason: string | null;
  is_full_day: boolean;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
}

export type DoctorLeaveInsert = Omit<DoctorLeave, 'id' | 'created_at'>;
export type DoctorLeaveUpdate = Partial<DoctorLeaveInsert>;

// ============================================================
// PROCEDURES & REFERRALS
// ============================================================

export type ProcedureStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';

export interface Procedure {
  id: string;
  hospital_id: string | null;
  patient_id: string | null;
  visit_id: string | null;
  admission_id: string | null;
  procedure_name: string;
  procedure_code: string | null;
  surgeon_id: string | null;
  anesthesiologist_id: string | null;
  dept_id: string | null;
  procedure_date: string | null;
  duration_minutes: number | null;
  anesthesia_type: string | null;
  status: ProcedureStatus | string;
  pre_op_notes: string | null;
  operative_notes: string | null;
  post_op_notes: string | null;
  complications: string | null;
  created_at: string;
}

export type ProcedureInsert = Omit<Procedure, 'id' | 'created_at'>;
export type ProcedureUpdate = Partial<ProcedureInsert>;

export type ReferralPriority = 'routine' | 'urgent' | 'emergency';
export type ReferralStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface Referral {
  id: string;
  hospital_id: string | null;
  patient_id: string | null;
  visit_id: string | null;
  referring_doctor_id: string | null;
  referred_to_doctor_id: string | null;
  referred_to_dept_id: string | null;
  referred_to_hospital: string | null;
  referral_reason: string;
  priority: ReferralPriority | string;
  clinical_notes: string | null;
  status: ReferralStatus | string;
  referral_date: string;
  created_at: string;
}

export type ReferralInsert = Omit<Referral, 'id' | 'created_at'>;
export type ReferralUpdate = Partial<ReferralInsert>;

// ============================================================
// PATIENT HISTORY, DOCUMENTS & INSURANCE
// ============================================================

export interface PatientMedicalHistory {
  id: string;
  patient_id: string | null;
  history_type: string;
  condition: string;
  diagnosed_date: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

export type PatientMedicalHistoryInsert = Omit<PatientMedicalHistory, 'id' | 'created_at'>;
export type PatientMedicalHistoryUpdate = Partial<PatientMedicalHistoryInsert>;

export interface PatientDocument {
  id: string;
  patient_id: string | null;
  visit_id: string | null;
  doc_type: string;
  doc_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export type PatientDocumentInsert = Omit<PatientDocument, 'id' | 'created_at'>;

export interface InsuranceProvider {
  id: string;
  hospital_id: string | null;
  name: string;
  provider_code: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_tpa: boolean;
  is_active: boolean;
  created_at: string;
}

export type InsuranceProviderInsert = Omit<InsuranceProvider, 'id' | 'created_at'>;
export type InsuranceProviderUpdate = Partial<InsuranceProviderInsert>;

export interface PatientInsurance {
  id: string;
  patient_id: string | null;
  provider_id: string | null;
  policy_number: string;
  member_id: string | null;
  policy_holder_name: string | null;
  coverage_amount: number | null;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
  created_at: string;
}

export type PatientInsuranceInsert = Omit<PatientInsurance, 'id' | 'created_at'>;
export type PatientInsuranceUpdate = Partial<PatientInsuranceInsert>;

// ============================================================
// HR: ATTENDANCE, LEAVES, PAYROLL
// ============================================================

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'on_leave' | 'holiday';

export interface StaffAttendance {
  id: string;
  staff_id: string | null;
  hospital_id: string | null;
  date: string;                 // ISO date string
  check_in: string | null;
  check_out: string | null;
  shift: string | null;
  status: AttendanceStatus | string;
  working_hours: number | null; // generated column, read-only
  notes: string | null;
  created_at: string;
}

export type StaffAttendanceInsert = Omit<StaffAttendance, 'id' | 'working_hours' | 'created_at'>;
export type StaffAttendanceUpdate = Partial<StaffAttendanceInsert>;

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface StaffLeave {
  id: string;
  staff_id: string | null;
  hospital_id: string | null;
  leave_type: string;
  from_date: string;
  to_date: string;
  days: number | null;
  reason: string | null;
  status: LeaveStatus | string;
  approved_by: string | null;
  approved_at: string | null;
  remarks: string | null;
  created_at: string;
}

export type StaffLeaveInsert = Omit<StaffLeave, 'id' | 'created_at'>;
export type StaffLeaveUpdate = Partial<StaffLeaveInsert>;

export type PayrollStatus = 'draft' | 'processed' | 'paid' | 'cancelled';

export interface Payroll {
  id: string;
  hospital_id: string | null;
  staff_id: string | null;
  month: number;                // 1–12
  year: number;
  basic_salary: number;
  hra: number;
  da: number;
  conveyance: number;
  medical_allowance: number;
  special_allowance: number;
  night_shift_allowance: number;
  gross_salary: number;
  pf_employee: number;
  esi_employee: number;
  tds: number;
  professional_tax: number;
  advance_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  working_days: number | null;
  present_days: number | null;
  overtime_hours: number;
  overtime_amount: number;
  status: PayrollStatus | string;
  processed_by: string | null;
  processed_at: string | null;
  payment_method: string | null;
  remarks: string | null;
  created_at: string;
}

export type PayrollInsert = Omit<Payroll, 'id' | 'created_at'>;
export type PayrollUpdate = Partial<PayrollInsert>;

// ============================================================
// INVENTORY
// ============================================================

export interface InventoryCategory {
  id: string;
  hospital_id: string | null;
  name: string;
  description: string | null;
  created_at: string;
}

export type InventoryCategoryInsert = Omit<InventoryCategory, 'id' | 'created_at'>;

export interface InventoryItem {
  id: string;
  hospital_id: string | null;
  category_id: string | null;
  item_code: string | null;
  name: string;
  unit: string;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  unit_price: number;
  supplier: string | null;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type InventoryItemInsert = Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>;
export type InventoryItemUpdate = Partial<InventoryItemInsert>;

export type InventoryTransactionType = 'stock_in' | 'stock_out' | 'return' | 'expired' | 'adjustment';

export interface InventoryTransaction {
  id: string;
  hospital_id: string | null;
  item_id: string | null;
  transaction_type: InventoryTransactionType | string;
  quantity: number;
  previous_stock: number | null;
  new_stock: number | null;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  recorded_by: string | null;
  transaction_date: string;
  created_at: string;
}

export type InventoryTransactionInsert = Omit<
  InventoryTransaction,
  'id' | 'previous_stock' | 'new_stock' | 'created_at'
>;

// ============================================================
// NOTIFICATIONS & AUDIT LOGS
// ============================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'alert';

export interface Notification {
  id: string;
  hospital_id: string | null;
  recipient_id: string | null;
  sender_id: string | null;
  title: string;
  message: string;
  type: NotificationType | string;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export type NotificationInsert = Omit<Notification, 'id' | 'created_at'>;

export interface AuditLog {
  id: string;
  hospital_id: string | null;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// ============================================================
// AMBULANCES & FEEDBACK
// ============================================================

export type AmbulanceStatus = 'available' | 'dispatched' | 'returning' | 'maintenance';
export type AmbulanceVehicleType = 'basic' | 'advanced' | 'neonatal' | 'mortuary';

export interface Ambulance {
  id: string;
  hospital_id: string | null;
  vehicle_no: string;
  vehicle_type: AmbulanceVehicleType | string;
  driver_name: string | null;
  driver_phone: string | null;
  current_status: AmbulanceStatus | string;
  created_at: string;
}

export type AmbulanceInsert = Omit<Ambulance, 'id' | 'created_at'>;
export type AmbulanceUpdate = Partial<AmbulanceInsert>;

export type AmbulanceCallStatus = 'received' | 'dispatched' | 'on_scene' | 'transporting' | 'completed' | 'cancelled';

export interface AmbulanceCall {
  id: string;
  hospital_id: string | null;
  ambulance_id: string | null;
  patient_id: string | null;
  caller_name: string | null;
  caller_phone: string;
  pickup_address: string;
  destination: string | null;
  call_time: string;
  dispatch_time: string | null;
  arrival_time: string | null;
  completion_time: string | null;
  status: AmbulanceCallStatus | string;
  notes: string | null;
  created_at: string;
}

export type AmbulanceCallInsert = Omit<AmbulanceCall, 'id' | 'created_at'>;
export type AmbulanceCallUpdate = Partial<AmbulanceCallInsert>;

export type FeedbackStatus = 'open' | 'in_review' | 'resolved' | 'closed';

export interface Feedback {
  id: string;
  hospital_id: string | null;
  patient_id: string | null;
  visit_id: string | null;
  feedback_type: string;
  subject: string;
  description: string | null;
  rating: 1 | 2 | 3 | 4 | 5 | null;
  is_anonymous: boolean;
  status: FeedbackStatus | string;
  response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
}

export type FeedbackInsert = Omit<Feedback, 'id' | 'created_at'>;
export type FeedbackUpdate = Partial<FeedbackInsert>;

// ============================================================
// VIEWS (read-only shapes)
// ============================================================

export interface PatientSummary {
  id: string;
  patient_code: string;
  name: string;
  phone: string;
  blood_group: string | null;
  gender: string | null;
  dob: string | null;
  photo_url: string | null;
  hospital_id: string | null;
  age: number | null;
  total_visits: number;
  last_visit_date: string | null;
  outstanding_amount: number;
  is_admitted: boolean;
  created_at: string;
}

export interface OpdToday {
  id: string;
  token_number: number;
  status: string;
  called_at: string | null;
  completed_at: string | null;
  created_at: string;
  estimated_wait_mins: number | null;
  patient_name: string;
  patient_code: string;
  patient_phone: string;
  blood_group: string | null;
  doctor_name: string | null;
  dept_name: string | null;
}

export interface BedStatusSummary {
  ward: string;
  floor: number | null;
  total_beds: number;
  available_beds: number;
  occupied_beds: number;
  maintenance_beds: number;
  occupancy_pct: number | null;
}

// ============================================================
// RPC RETURN TYPES
// ============================================================

export interface RegisterHospitalResult {
  hospital_id: string;
  name: string;
  role: 'super_admin';
}

export interface GetUsersWithRolesRow {
  user_id: string;
  email: string;
  full_name: string | null;
  roles: string[];
  is_active: boolean;
  created_at: string;
}

// ============================================================
// SUPABASE DATABASE HELPER TYPE (optional, for typed client)
// ============================================================

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at'>; Update: Partial<Profile> };
      user_roles: { Row: UserRole; Insert: Omit<UserRole, 'id'>; Update: Partial<UserRole> };
      hospitals: { Row: Hospital; Insert: HospitalInsert; Update: HospitalUpdate };
      departments: { Row: Department; Insert: DepartmentInsert; Update: DepartmentUpdate };
      doctors: { Row: Doctor; Insert: DoctorInsert; Update: DoctorUpdate };
      patients: { Row: Patient; Insert: PatientInsert; Update: PatientUpdate };
      appointments: { Row: Appointment; Insert: AppointmentInsert; Update: AppointmentUpdate };
      visits: { Row: Visit; Insert: VisitInsert; Update: VisitUpdate };
      lab_orders: { Row: LabOrder; Insert: LabOrderInsert; Update: LabOrderUpdate };
      radiology_orders: { Row: RadiologyOrder; Insert: RadiologyOrderInsert; Update: RadiologyOrderUpdate };
      prescriptions: { Row: Prescription; Insert: PrescriptionInsert; Update: PrescriptionUpdate };
      drugs: { Row: Drug; Insert: DrugInsert; Update: DrugUpdate };
      beds: { Row: Bed; Insert: BedInsert; Update: BedUpdate };
      invoices: { Row: Invoice; Insert: InvoiceInsert; Update: InvoiceUpdate };
      invoice_items: { Row: InvoiceItem; Insert: InvoiceItemInsert; Update: InvoiceItemUpdate };
      payments: { Row: Payment; Insert: PaymentInsert; Update: never };
      staff: { Row: Staff; Insert: StaffInsert; Update: StaffUpdate };
      service_catalog: { Row: ServiceCatalog; Insert: ServiceCatalogInsert; Update: ServiceCatalogUpdate };
      opd_queue: { Row: OpdQueue; Insert: OpdQueueInsert; Update: OpdQueueUpdate };
      triage_records: { Row: TriageRecord; Insert: TriageRecordInsert; Update: TriageRecordUpdate };
      ipd_admissions: { Row: IpdAdmission; Insert: IpdAdmissionInsert; Update: IpdAdmissionUpdate };
      vitals: { Row: VitalsRecord; Insert: VitalsRecordInsert; Update: VitalsRecordUpdate };
      nursing_notes: { Row: NursingNote; Insert: NursingNoteInsert; Update: NursingNoteUpdate };
      ward_rounds: { Row: WardRound; Insert: WardRoundInsert; Update: WardRoundUpdate };
      doctor_schedules: { Row: DoctorSchedule; Insert: DoctorScheduleInsert; Update: DoctorScheduleUpdate };
      doctor_leaves: { Row: DoctorLeave; Insert: DoctorLeaveInsert; Update: DoctorLeaveUpdate };
      procedures: { Row: Procedure; Insert: ProcedureInsert; Update: ProcedureUpdate };
      referrals: { Row: Referral; Insert: ReferralInsert; Update: ReferralUpdate };
      patient_medical_history: { Row: PatientMedicalHistory; Insert: PatientMedicalHistoryInsert; Update: PatientMedicalHistoryUpdate };
      patient_documents: { Row: PatientDocument; Insert: PatientDocumentInsert; Update: never };
      insurance_providers: { Row: InsuranceProvider; Insert: InsuranceProviderInsert; Update: InsuranceProviderUpdate };
      patient_insurance: { Row: PatientInsurance; Insert: PatientInsuranceInsert; Update: PatientInsuranceUpdate };
      staff_attendance: { Row: StaffAttendance; Insert: StaffAttendanceInsert; Update: StaffAttendanceUpdate };
      staff_leaves: { Row: StaffLeave; Insert: StaffLeaveInsert; Update: StaffLeaveUpdate };
      payroll: { Row: Payroll; Insert: PayrollInsert; Update: PayrollUpdate };
      inventory_categories: { Row: InventoryCategory; Insert: InventoryCategoryInsert; Update: Partial<InventoryCategoryInsert> };
      inventory_items: { Row: InventoryItem; Insert: InventoryItemInsert; Update: InventoryItemUpdate };
      inventory_transactions: { Row: InventoryTransaction; Insert: InventoryTransactionInsert; Update: never };
      notifications: { Row: Notification; Insert: NotificationInsert; Update: Partial<Notification> };
      audit_logs: { Row: AuditLog; Insert: never; Update: never };
      ambulances: { Row: Ambulance; Insert: AmbulanceInsert; Update: AmbulanceUpdate };
      ambulance_calls: { Row: AmbulanceCall; Insert: AmbulanceCallInsert; Update: AmbulanceCallUpdate };
      feedback: { Row: Feedback; Insert: FeedbackInsert; Update: FeedbackUpdate };
    };
    Views: {
      patient_summary: { Row: PatientSummary };
      opd_today: { Row: OpdToday };
      bed_status_summary: { Row: BedStatusSummary };
    };
    Functions: {
      has_role: { Args: { _user_id: string; _role: AppRole }; Returns: boolean };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
      register_hospital: { Args: Partial<HospitalInsert> & { p_name: string }; Returns: RegisterHospitalResult };
      assign_user_role: { Args: { p_user_id: string; p_role: AppRole; p_hospital_id?: string }; Returns: void };
      revoke_user_role: { Args: { p_user_id: string; p_role: AppRole }; Returns: void };
      get_users_with_roles: { Args: Record<never, never>; Returns: GetUsersWithRolesRow[] };
      get_next_opd_token: { Args: { p_doctor_id?: string; p_dept_id?: string }; Returns: number };
      send_notification: { Args: { p_recipient_id: string; p_title: string; p_message: string; p_type?: string; p_link?: string; p_hospital_id?: string }; Returns: void };
      log_audit: { Args: { p_action: string; p_table_name?: string; p_record_id?: string; p_old_values?: Record<string, unknown>; p_new_values?: Record<string, unknown> }; Returns: void };
    };
    Enums: {
      app_role: AppRole;
    };
  };
}