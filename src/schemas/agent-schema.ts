import * as z from "zod";

// Helper function to get user's timezone
const getUserTimezone = (): string => {
  try {
    // Detect user's timezone from browser
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    // Fallback to Asia/Jakarta if detection fails
    console.warn("Could not detect timezone, falling back to Asia/Jakarta");
    return "Asia/Jakarta";
  }
};

// Schema for follow-up messages
export const followUpMessageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Follow-up name is required"),
  delay: z.number().min(1, "Delay must be at least 1 minute"),
  message: z.string().min(1, "Message content is required"),
});
export type FollowUpMessage = z.infer<typeof followUpMessageSchema>;

// Schema for follow-up messages array with duplicate delay validation
export const followUpMessagesArraySchema = z
  .array(followUpMessageSchema)
  .refine(
    (messages) => {
      const delays = messages.map((msg) => msg.delay);
      const uniqueDelays = new Set(delays);
      return delays.length === uniqueDelays.size;
    },
    {
      message: "Each follow-up message must have a unique delay time",
    }
  );

// Schema for scheduling settings
export const scheduleSchema = z.object({
  always_active: z.boolean().default(true),
  days: z.object({
    monday: z.object({
      active: z.boolean().default(true),
      open_time: z.string().default("09:00"),
      close_time: z.string().default("17:00"),
    }),
    tuesday: z.object({
      active: z.boolean().default(true),
      open_time: z.string().default("09:00"),
      close_time: z.string().default("17:00"),
    }),
    wednesday: z.object({
      active: z.boolean().default(true),
      open_time: z.string().default("09:00"),
      close_time: z.string().default("17:00"),
    }),
    thursday: z.object({
      active: z.boolean().default(true),
      open_time: z.string().default("09:00"),
      close_time: z.string().default("17:00"),
    }),
    friday: z.object({
      active: z.boolean().default(true),
      open_time: z.string().default("09:00"),
      close_time: z.string().default("17:00"),
    }),
    saturday: z.object({
      active: z.boolean().default(false),
      open_time: z.string().default("09:00"),
      close_time: z.string().default("17:00"),
    }),
    sunday: z.object({
      active: z.boolean().default(false),
      open_time: z.string().default("09:00"),
      close_time: z.string().default("17:00"),
    }),
  }),
  timezone: z.string().default(getUserTimezone()),
});
export type Schedule = z.infer<typeof scheduleSchema>;

// Schema for tools/webhooks
export const toolSchema = z.object({
  id: z.string().optional(),
  type: z.literal("webhook"),
  name: z
    .string()
    .min(1, "Name is required")
    .regex(
      /^[a-zA-Z0-9_-]{1,64}$/,
      "Name must be 1-64 characters long and can only contain letters, numbers, underscores and hyphens"
    ),
  description: z.string().min(1, "Description is required"),
  api_schema: z.object({
    url: z.string().url("Must be a valid URL"),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
    request_headers: z
      .record(z.string().or(z.object({ secret_id: z.string() })))
      .optional(),
    path_params_schema: z.record(
      z.object({
        type: z.string(),
        description: z.string().optional(),
        dynamic_variable: z.string().optional(),
        id: z.string(),
        required: z.boolean(),
      })
    ),
    query_params_schema: z
      .object({
        properties: z.record(
          z.object({
            type: z.string(),
            description: z.string().optional(),
            dynamic_variable: z.string().optional(),
          })
        ),
        required: z.array(z.string()),
      })
      .optional(),
    request_body_schema: z
      .object({
        type: z.literal("object"),
        description: z.string().min(1, "Description is required"),
        properties: z
          .record(
            z
              .object({
                type: z.string(),
                valueType: z.enum(["llm_prompt", "dynamic_variable"]),
                description: z.string().optional(),
                dynamic_variable: z.string().optional(),
              })
              .superRefine((data, ctx) => {
                if (
                  data.valueType === "llm_prompt" &&
                  (!data.description || data.description.length === 0)
                ) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Description is required for LLM prompt",
                  });
                }
                if (
                  data.valueType === "dynamic_variable" &&
                  (!data.dynamic_variable || data.dynamic_variable.length === 0)
                ) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Variable name is required for dynamic variable",
                  });
                }
              })
          )
          .refine(
            (val) => Object.keys(val).length > 0,
            "At least one property is required"
          ),
        required: z.array(z.string()).default([]),
      })
      .strict()
      .optional(),
  }),
});
export type Tool = z.infer<typeof toolSchema>;

// Schema for knowledge base documents
export const knowledgeBaseItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.string(),
  url: z.string().optional(),
  content: z.string().optional(),
});
export type KnowledgeBaseItem = z.infer<typeof knowledgeBaseItemSchema>;

// Schema for file references
export const fileReferenceSchema = z.object({
  id: z.string().optional(),
  file_id: z.string().optional(),
  file_reference: z.string(),
  name: z.string(),
  description: z.string().optional(),
  file_url: z.string(),
  file_type: z.string(),
  file_size: z.number().optional(),
  real_name: z.string(),
  usage_context: z.string().optional(),
  status: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type FileReference = z.infer<typeof fileReferenceSchema>;

// Schema for data collection fields
export const dataCollectionFieldSchema = z.object({
  id: z.string().optional(),
  identifier: z.string().min(1, "Field identifier is required"),
  dataType: z.enum(["string", "number", "date", "boolean"]).default("string"),
  description: z.string().min(1, "Instruction to AI is required"),
});
export type DataCollectionField = z.infer<typeof dataCollectionFieldSchema>;

// Helper function to extract file references from system prompt
export const extractFileReferences = (systemPrompt: string): string[] => {
  const fileReferencePattern = /file-([a-zA-Z0-9_-]+)/g;
  const matches: string[] = [];
  let match;

  while ((match = fileReferencePattern.exec(systemPrompt)) !== null) {
    matches.push(match[0]); // match[0] includes the full "file-X" pattern
  }

  return matches;
};

// Main agent schema
export const agentSchema = z.object({
  name: z.string().min(1, "Agent name is required"),

  language: z.enum(["en", "id"]).default("id"),
  description: z.string().min(1, "Description is required"),
  system_prompt: z.string().min(1, "System prompt is required"),

  // WhatsApp connection settings
  whatsapp_connection: z
    .object({
      account_id: z.string().optional(),
      phone_number: z.string().optional(),
    })
    .optional(),

  // Knowledge base
  knowledge_base: z.array(knowledgeBaseItemSchema).optional().default([]),

  // File references
  files: z.array(fileReferenceSchema).optional().default([]),

  // Tools/Webhooks
  tools: z.array(toolSchema).optional().default([]),

  // Scheduling settings
  availability_schedule: scheduleSchema.optional().default({
    always_active: true,
    days: {
      monday: { active: true, open_time: "09:00", close_time: "17:00" },
      tuesday: { active: true, open_time: "09:00", close_time: "17:00" },
      wednesday: { active: true, open_time: "09:00", close_time: "17:00" },
      thursday: { active: true, open_time: "09:00", close_time: "17:00" },
      friday: { active: true, open_time: "09:00", close_time: "17:00" },
      saturday: { active: true, open_time: "09:00", close_time: "17:00" },
      sunday: { active: true, open_time: "09:00", close_time: "17:00" },
    },
    timezone: getUserTimezone(),
  }),

  // Advanced settings
  advanced_settings: z
    .object({
      disable_ai_after_manual_response: z.boolean().default(false),
      manual_takeover_auto_reset_minutes: z.number().min(1).default(30),
      data_collection_fields: z
        .array(dataCollectionFieldSchema)
        .optional()
        .default([]),
    })
    .optional()
    .default({
      disable_ai_after_manual_response: false,
      manual_takeover_auto_reset_minutes: 30,
      data_collection_fields: [],
    }),
});

export type AgentSchema = z.infer<typeof agentSchema>;

// Default values for the agent
export const defaultAgentValues: AgentSchema = {
  name: "Agen WhatsApp Baru",
  language: "id",
  description: "Deskripsi Agent WhatsApp Baru",
  system_prompt:
    "Anda adalah asisten WhatsApp yang membantu memberikan dukungan pelanggan.",
  whatsapp_connection: {
    account_id: "",
    phone_number: "",
  },
  knowledge_base: [],
  files: [],
  tools: [],
  availability_schedule: {
    always_active: true,
    days: {
      monday: { active: true, open_time: "09:00", close_time: "17:00" },
      tuesday: { active: true, open_time: "09:00", close_time: "17:00" },
      wednesday: { active: true, open_time: "09:00", close_time: "17:00" },
      thursday: { active: true, open_time: "09:00", close_time: "17:00" },
      friday: { active: true, open_time: "09:00", close_time: "17:00" },
      saturday: { active: true, open_time: "09:00", close_time: "17:00" },
      sunday: { active: true, open_time: "09:00", close_time: "17:00" },
    },
    timezone: getUserTimezone(),
  },
  advanced_settings: {
    disable_ai_after_manual_response: false,
    manual_takeover_auto_reset_minutes: 30,
    data_collection_fields: [],
  },
};
