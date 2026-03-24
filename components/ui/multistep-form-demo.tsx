"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const steps = [
  { id: "business", title: "Your Business" },
  { id: "audience", title: "Your Audience" },
  { id: "goals", title: "Your Goals" },
  { id: "launch", title: "Launch" },
];

const industries = [
  "Hotels & Hospitality",
  "Restaurants & Food",
  "Coaching & Consulting",
  "Real Estate",
  "Fitness & Wellness",
  "Retail & E-commerce",
  "Beauty & Salon",
  "Tours & Travel",
  "Education",
  "Other",
];

const toneOptions = [
  "Friendly & Casual",
  "Professional & Authoritative",
  "Inspirational & Motivational",
  "Playful & Humorous",
  "Luxury & Premium",
];

const goalOptions = [
  "More Bookings",
  "More Leads",
  "More Followers",
  "Brand Awareness",
  "Customer Retention",
  "Drive Sales",
];

const platformOptions = [
  "Instagram",
  "Facebook",
  "LinkedIn",
  "Twitter/X",
  "TikTok",
  "YouTube",
];

interface FormData {
  fullName: string;
  companyName: string;
  industry: string;
  niche: string;
  targetAudience: string;
  offerings: string;
  toneOfVoice: string;
  goals: string[];
  platforms: string[];
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
};

const OnboardingForm = () => {
  const router = useRouter();
  const supabase = getSupabase();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    companyName: "",
    industry: "",
    niche: "",
    targetAudience: "",
    offerings: "",
    toneOfVoice: "",
    goals: [],
    platforms: [],
  });

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: "goals" | "platforms", item: string) => {
    setFormData((prev) => {
      const current = [...prev[field]];
      if (current.includes(item)) {
        return { ...prev, [field]: current.filter((i) => i !== item) };
      } else {
        return { ...prev, [field]: [...current, item] };
      }
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save profile data to Supabase
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          company_name: formData.companyName,
          industry: formData.industry,
          niche: formData.niche,
          target_audience: formData.targetAudience,
          offerings: formData.offerings,
          tone_of_voice: formData.toneOfVoice,
          goals: formData.goals,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (profileError) {
        throw new Error(profileError.message);
      }

      // Trigger 30-day calendar generation
      const calendarRes = await fetch("/api/generate/calendar-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: formData }),
      });

      if (!calendarRes.ok) {
        throw new Error("Failed to generate calendar plan.");
      }

      toast.success("Your 30-day content calendar is ready!");
      router.push("/dashboard");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return (
          formData.fullName.trim() !== "" &&
          formData.companyName.trim() !== ""
        );
      case 1:
        return formData.targetAudience.trim() !== "";
      case 2:
        return formData.goals.length > 0 && formData.platforms.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto py-8">
      {/* Progress indicator */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center"
              whileHover={{ scale: 1.1 }}
            >
              <motion.div
                className={cn(
                  "w-4 h-4 rounded-full cursor-pointer transition-colors duration-300",
                  index < currentStep
                    ? "bg-primary"
                    : index === currentStep
                      ? "bg-primary ring-4 ring-primary/20"
                      : "bg-muted",
                )}
                onClick={() => {
                  if (index <= currentStep) {
                    setCurrentStep(index);
                  }
                }}
                whileTap={{ scale: 0.95 }}
              />
              <motion.span
                className={cn(
                  "text-xs mt-1.5 hidden sm:block",
                  index === currentStep
                    ? "text-primary font-medium"
                    : "text-muted-foreground",
                )}
              >
                {step.title}
              </motion.span>
            </motion.div>
          ))}
        </div>
        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border shadow-md rounded-3xl overflow-hidden">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={contentVariants}
              >
                {/* Step 1: Your Business */}
                {currentStep === 0 && (
                  <>
                    <CardHeader>
                      <CardTitle>Your Business</CardTitle>
                      <CardDescription>
                        Tell us about your brand so our AI can craft the perfect
                        strategy.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          placeholder="Your full name"
                          value={formData.fullName}
                          onChange={(e) =>
                            updateFormData("fullName", e.target.value)
                          }
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="companyName">Company / Brand Name</Label>
                        <Input
                          id="companyName"
                          placeholder="Your company or brand name"
                          value={formData.companyName}
                          onChange={(e) =>
                            updateFormData("companyName", e.target.value)
                          }
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Select
                          value={formData.industry}
                          onValueChange={(value) =>
                            updateFormData("industry", value)
                          }
                        >
                          <SelectTrigger
                            id="industry"
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          >
                            <SelectValue placeholder="Select your industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map((industry) => (
                              <SelectItem key={industry} value={industry}>
                                {industry}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="niche">Niche</Label>
                        <Input
                          id="niche"
                          placeholder="e.g. Boutique hotel in Cabo, Fitness coach for busy moms"
                          value={formData.niche}
                          onChange={(e) =>
                            updateFormData("niche", e.target.value)
                          }
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 2: Your Audience */}
                {currentStep === 1 && (
                  <>
                    <CardHeader>
                      <CardTitle>Your Audience</CardTitle>
                      <CardDescription>
                        Help us understand who you&apos;re speaking to and what
                        you offer.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="targetAudience">Target Audience</Label>
                        <Textarea
                          id="targetAudience"
                          placeholder="Describe your ideal customer: age, interests, location"
                          value={formData.targetAudience}
                          onChange={(e) =>
                            updateFormData("targetAudience", e.target.value)
                          }
                          className="min-h-[80px] transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="offerings">Offerings</Label>
                        <Textarea
                          id="offerings"
                          placeholder="What products or services do you offer?"
                          value={formData.offerings}
                          onChange={(e) =>
                            updateFormData("offerings", e.target.value)
                          }
                          className="min-h-[80px] transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="toneOfVoice">Tone of Voice</Label>
                        <Select
                          value={formData.toneOfVoice}
                          onValueChange={(value) =>
                            updateFormData("toneOfVoice", value)
                          }
                        >
                          <SelectTrigger
                            id="toneOfVoice"
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          >
                            <SelectValue placeholder="Select your brand tone" />
                          </SelectTrigger>
                          <SelectContent>
                            {toneOptions.map((tone) => (
                              <SelectItem key={tone} value={tone}>
                                {tone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 3: Your Goals */}
                {currentStep === 2 && (
                  <>
                    <CardHeader>
                      <CardTitle>Your Goals</CardTitle>
                      <CardDescription>
                        What do you want to achieve and where do you want to post?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <motion.div variants={fadeInUp} className="space-y-3">
                        <Label>Primary Goals</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {goalOptions.map((goal, index) => (
                            <motion.div
                              key={goal}
                              className={cn(
                                "flex items-center space-x-2 rounded-md border p-3 cursor-pointer transition-colors",
                                formData.goals.includes(goal)
                                  ? "border-primary bg-primary/10"
                                  : "hover:bg-accent",
                              )}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                  delay: 0.05 * index,
                                  duration: 0.3,
                                },
                              }}
                              onClick={() => toggleArrayField("goals", goal)}
                            >
                              <Checkbox
                                id={`goal-${goal}`}
                                checked={formData.goals.includes(goal)}
                                onCheckedChange={() =>
                                  toggleArrayField("goals", goal)
                                }
                              />
                              <Label
                                htmlFor={`goal-${goal}`}
                                className="cursor-pointer w-full"
                              >
                                {goal}
                              </Label>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-3">
                        <Label>Which platforms?</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {platformOptions.map((platform, index) => (
                            <motion.div
                              key={platform}
                              className={cn(
                                "flex items-center space-x-2 rounded-md border p-3 cursor-pointer transition-colors",
                                formData.platforms.includes(platform)
                                  ? "border-primary bg-primary/10"
                                  : "hover:bg-accent",
                              )}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                  delay: 0.05 * index,
                                  duration: 0.3,
                                },
                              }}
                              onClick={() =>
                                toggleArrayField("platforms", platform)
                              }
                            >
                              <Checkbox
                                id={`platform-${platform}`}
                                checked={formData.platforms.includes(platform)}
                                onCheckedChange={() =>
                                  toggleArrayField("platforms", platform)
                                }
                              />
                              <Label
                                htmlFor={`platform-${platform}`}
                                className="cursor-pointer w-full"
                              >
                                {platform}
                              </Label>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 4: Launch Your AI Engine */}
                {currentStep === 3 && (
                  <>
                    <CardHeader>
                      <CardTitle>Launch Your AI Engine</CardTitle>
                      <CardDescription>
                        Review your details and let Puls build your
                        personalized content strategy.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isSubmitting ? (
                        <motion.div
                          className="flex flex-col items-center justify-center py-12 space-y-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.4 }}
                        >
                          <Loader2 className="h-10 w-10 animate-spin text-primary" />
                          <p className="text-lg font-medium text-muted-foreground">
                            Building your 30-day AI strategy...
                          </p>
                        </motion.div>
                      ) : (
                        <>
                          <motion.div
                            variants={fadeInUp}
                            className="space-y-3 text-sm"
                          >
                            <div className="rounded-lg border p-4 space-y-3">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Name
                                </span>
                                <span className="font-medium">
                                  {formData.fullName || "--"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Company
                                </span>
                                <span className="font-medium">
                                  {formData.companyName || "--"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Industry
                                </span>
                                <span className="font-medium">
                                  {formData.industry || "--"}
                                </span>
                              </div>
                              {formData.niche && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Niche
                                  </span>
                                  <span className="font-medium text-right max-w-[200px]">
                                    {formData.niche}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Tone
                                </span>
                                <span className="font-medium">
                                  {formData.toneOfVoice || "--"}
                                </span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-muted-foreground">
                                  Goals
                                </span>
                                <span className="font-medium text-right max-w-[200px]">
                                  {formData.goals.length > 0
                                    ? formData.goals.join(", ")
                                    : "--"}
                                </span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-muted-foreground">
                                  Platforms
                                </span>
                                <span className="font-medium text-right max-w-[200px]">
                                  {formData.platforms.length > 0
                                    ? formData.platforms.join(", ")
                                    : "--"}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </CardContent>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
            <CardFooter className="flex justify-between pt-6 pb-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0 || isSubmitting}
                  className="flex items-center gap-1 transition-all duration-300 rounded-2xl"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {currentStep === steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 transition-all duration-300 rounded-2xl px-6"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />{" "}
                        Generating...
                      </>
                    ) : (
                      <>
                        <Rocket className="h-4 w-4" /> Generate My 30-Day
                        Content Calendar
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="flex items-center gap-1 transition-all duration-300 rounded-2xl"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            </CardFooter>
          </div>
        </Card>
      </motion.div>

      {/* Step indicator */}
      <motion.div
        className="mt-4 text-center text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
      </motion.div>
    </div>
  );
};

export default OnboardingForm;
