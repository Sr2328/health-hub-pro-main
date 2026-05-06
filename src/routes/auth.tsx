import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Stethoscope, Eye, EyeOff, ChevronLeft, ChevronRight, Star, Activity, Shield, Users, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const TESTIMONIALS = [
  {
    text: "Metro Multifacility Hospital's HMS has transformed how we manage patient records. The seamless coordination between departments has reduced wait times significantly.",
    name: "Dr. Priya Sharma",
    role: "Chief Medical Officer",
    rating: 5,
  },
  {
    text: "The billing and inventory management modules are incredibly robust. Our finance team has saved countless hours every week since we moved to this platform.",
    name: "Rajesh Menon",
    role: "Hospital Administrator",
    rating: 5,
  },
  {
    text: "Patient safety and data security are our top priorities. This system gives us confidence that every record is protected and audit trails are maintained.",
    name: "Dr. Aisha Khan",
    role: "Head of Nursing",
    rating: 5,
  },
];

const STATS = [
  { icon: Users, label: "Patients Served", value: "50K+" },
  { icon: Activity, label: "Uptime", value: "99.9%" },
  { icon: Shield, label: "Data Security", value: "HIPAA" },
  { icon: Clock, label: "Support", value: "24 / 7" },
];

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  // auto-advance testimonials
  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(t);
  }, []);

  const signIn = async () => {
    if (!email || !password) return toast.error("Please fill in all fields");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/" });
  };

  const signUp = async () => {
    if (!name || !email || !password) return toast.error("Please fill in all fields");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — welcome!");
    navigate({ to: "/" });
  };

  const active = tab === "signin" ? signIn : signUp;
  const testimonial = TESTIMONIALS[testimonialIdx];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0f2d6b 0%, #1a4fc4 50%, #0a1f4e 100%)" }}
    >
      {/* ── outer card ─────────────────────────────────────────────── */}
      <div
        className="w-full flex overflow-hidden"
        style={{
          maxWidth: 960,
          minHeight: 560,
          borderRadius: 20,
          boxShadow: "0 32px 80px rgba(0,0,0,0.45)",
        }}
      >
        {/* ── LEFT: form panel ──────────────────────────────────────── */}
        <div
          className="flex flex-col justify-center w-full lg:w-[45%] p-8 sm:p-10"
          style={{ background: "#ffffff", flexShrink: 0 }}
        >
          {/* logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{
                width: 38,
                height: 38,
                background: "linear-gradient(135deg, #1a4fc4, #0f2d6b)",
                flexShrink: 0,
              }}
            >
              <Stethoscope className="text-white" style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight" style={{ color: "#0f2d6b", letterSpacing: "-0.01em" }}>
                METRO
              </p>
              <p className="text-[10px] leading-tight font-medium" style={{ color: "#5a7ac7", letterSpacing: "0.04em" }}>
                MULTIFACILITY HOSPITAL
              </p>
            </div>
          </div>

          {/* heading */}
          <h1 className="font-bold mb-1" style={{ fontSize: 22, color: "#0d1b3e", letterSpacing: "-0.02em" }}>
            {tab === "signin" ? "Log in to your account" : "Create an account"}
          </h1>
          <p className="text-sm mb-7" style={{ color: "#7a8ba8" }}>
            {tab === "signin"
              ? "Welcome back! Please enter your details."
              : "Join the HMS — fill in your details below."}
          </p>

          {/* tab switcher */}
          <div
            className="flex mb-6 p-1 rounded-lg"
            style={{ background: "#f0f4ff", gap: 4 }}
          >
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 text-sm font-medium py-1.5 rounded-md transition-all"
                style={{
                  background: tab === t ? "#ffffff" : "transparent",
                  color: tab === t ? "#0f2d6b" : "#7a8ba8",
                  boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {t === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* form fields */}
          <div className="space-y-4">
            {tab === "signup" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium" style={{ color: "#374151" }}>
                  Full Name
                </Label>
                <Input
                  placeholder="Dr. John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 text-sm"
                  style={{ borderColor: "#d1daf0", borderRadius: 8 }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm font-medium" style={{ color: "#374151" }}>
                Email
              </Label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-sm"
                style={{ borderColor: "#d1daf0", borderRadius: 8 }}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium" style={{ color: "#374151" }}>
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && active()}
                  className="h-10 text-sm pr-10"
                  style={{ borderColor: "#d1daf0", borderRadius: 8 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#9aa8c4", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>

            {tab === "signin" && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(c) => setRememberMe(!!c)}
                  />
                  <label htmlFor="remember" className="text-sm cursor-pointer" style={{ color: "#5a6a85" }}>
                    Remember for 30 days
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium"
                  style={{ color: "#1a4fc4", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Forgot password
                </button>
              </div>
            )}

            <Button
              onClick={active}
              disabled={loading}
              className="w-full h-10 text-sm font-semibold mt-1"
              style={{
                background: loading ? "#7a9ee0" : "linear-gradient(90deg, #1a4fc4, #2563eb)",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Please wait…" : tab === "signin" ? "Login" : "Create Account"}
            </Button>

            {tab === "signup" && (
              <p className="text-xs text-center" style={{ color: "#9aa8c4" }}>
                First registered user can claim Super Admin from the dashboard.
              </p>
            )}

            <p className="text-sm text-center" style={{ color: "#5a6a85" }}>
              {tab === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setTab("signup")}
                    className="font-semibold"
                    style={{ color: "#1a4fc4", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setTab("signin")}
                    className="font-semibold"
                    style={{ color: "#1a4fc4", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* ── RIGHT: hero panel ─────────────────────────────────────── */}
        <div
          className="hidden lg:flex flex-col justify-between flex-1 p-10"
          style={{
            background: "linear-gradient(145deg, #1a4fc4 0%, #0f2d6b 60%, #081840 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* decorative circles */}
          <div
            style={{
              position: "absolute",
              top: -80,
              right: -80,
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              pointerEvents: "none",
            }}
          />

          {/* headline */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2
              className="font-extrabold leading-tight"
              style={{ fontSize: 36, color: "#ffffff", letterSpacing: "-0.03em" }}
            >
              Delivering Care,
              <br />
              <span style={{ color: "#7eb3ff" }}>Powered by Data</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "#8baee0", maxWidth: 280 }}>
              Metro Multifacility Hospital's integrated HMS — connecting patients, doctors, and operations in one platform.
            </p>

            {/* stats row */}
            <div className="grid grid-cols-2 gap-3 mt-8">
              {STATS.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{ width: 32, height: 32, background: "rgba(255,255,255,0.12)", flexShrink: 0 }}
                  >
                    <Icon style={{ width: 16, height: 16, color: "#7eb3ff" }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#ffffff" }}>{value}</p>
                    <p className="text-[11px]" style={{ color: "#7a9fc7" }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* testimonial card */}
          <div
            className="rounded-2xl p-5 mt-8"
            style={{
              background: "rgba(255,255,255,0.09)",
              border: "1px solid rgba(255,255,255,0.12)",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* stars */}
            <div className="flex gap-1 mb-3">
              {Array.from({ length: testimonial.rating }).map((_, i) => (
                <Star key={i} style={{ width: 14, height: 14, fill: "#f59e0b", color: "#f59e0b" }} />
              ))}
            </div>

            <p className="text-sm leading-relaxed mb-4" style={{ color: "#c8daf5" }}>
              "{testimonial.text}"
            </p>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>{testimonial.name}</p>
                <p className="text-xs" style={{ color: "#7a9fc7" }}>{testimonial.role}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setTestimonialIdx((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
                  }
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 30,
                    height: 30,
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    cursor: "pointer",
                    color: "#c8daf5",
                  }}
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft style={{ width: 14, height: 14 }} />
                </button>
                <button
                  onClick={() => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length)}
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 30,
                    height: 30,
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    cursor: "pointer",
                    color: "#c8daf5",
                  }}
                  aria-label="Next testimonial"
                >
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>

            {/* dots */}
            <div className="flex gap-1.5 mt-3">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIdx(i)}
                  style={{
                    width: i === testimonialIdx ? 18 : 6,
                    height: 6,
                    borderRadius: 99,
                    background: i === testimonialIdx ? "#7eb3ff" : "rgba(255,255,255,0.25)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "width 0.3s ease, background 0.3s ease",
                  }}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}