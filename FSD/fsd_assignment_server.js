require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { Schema, model, Error: MongooseError } = mongoose;

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/symposium";

const DISCOUNTS = {
  CAMPUS50: (price) => price / 2,
  EARLYBIRD: (price) => Math.max(0, price - 100),
};
const isKnownCode = (code) => Object.prototype.hasOwnProperty.call(DISCOUNTS, code);
const priceAfterDiscount = (price, code) =>
  code && isKnownCode(code) ? DISCOUNTS[code](price) : price;

const EVENTS = ["CODING_HACKATHON", "AI_WORKSHOP", "ROBOTICS", "GAMING"];
const STATES = ["PENDING", "CONFIRMED", "CANCELLED"];

const registrationSchema = new Schema(
  {
    studentName: {
      type: String,
      required: [true, "studentName is required"],
      trim: true,
      minlength: [3, "studentName needs at least 3 characters"],
      maxlength: [50, "studentName can have at most 50 characters"],
    },
    collegeEmail: {
      type: String,
      required: [true, "collegeEmail is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.(edu|ac\.in)$/, "Must be a valid college email ending in .edu or .ac.in"],
    },
    rollNumber: {
      type: String,
      required: [true, "rollNumber is required"],
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9]{8,10}$/, "rollNumber must be 8-10 letters/digits only"],
    },
    eventType: {
      type: String,
      required: [true, "eventType is required"],
      enum: { values: EVENTS, message: `eventType must be one of ${EVENTS.join(", ")}` },
    },
    teamSize: {
      type: Number,
      required: [true, "teamSize is required"],
      min: [1, "teamSize must be at least 1"],
      max: [4, "teamSize must be at most 4"],
      validate: { validator: Number.isInteger, message: "teamSize must be a whole number" },
    },
    ticketPrice: {
      type: Number,
      required: [true, "ticketPrice is required"],
      min: [0, "ticketPrice cannot be below 0"],
    },
    discountCode: {
      type: String,
      trim: true,
      uppercase: true,
      validate: { validator: (v) => !v || isKnownCode(v), message: "Invalid discount code" },
    },
    finalAmount: Number,
    status: {
      type: String,
      enum: { values: STATES, message: `status must be one of ${STATES.join(", ")}` },
      default: "PENDING",
    },
    registrationDate: {
      type: Date,
      default: Date.now,
      validate: {
        validator: (d) => d.getTime() <= Date.now(),
        message: "registrationDate cannot be in the future",
      },
    },
  },
  { versionKey: false }
);

registrationSchema.pre("validate", function (next) {
  if (this.eventType === "AI_WORKSHOP" && this.teamSize != null && this.teamSize !== 1) {
    this.invalidate("teamSize", "AI Workshop only permits individual registrations", this.teamSize);
  }
  if (typeof this.ticketPrice === "number") {
    this.finalAmount = priceAfterDiscount(this.ticketPrice, this.discountCode);
  }
  next();
});

const Registration = model("Registration", registrationSchema);

class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const catchAsync = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const WRITABLE = ["studentName", "collegeEmail", "rollNumber", "eventType", "teamSize", "ticketPrice", "discountCode", "status"];
const writableOnly = (body = {}) =>
  Object.fromEntries(WRITABLE.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));

const loadOr404 = async (id) => {
  const doc = await Registration.findById(id);
  if (!doc) throw new ApiError(404, "Registration not found");
  return doc;
};

const router = express.Router();

router.param("id", (req, res, next, id) => {
  if (!/^[0-9a-f]{24}$/i.test(id)) return next(new ApiError(400, "Invalid registration ID format"));
  next();
});

router.post("/", catchAsync(async (req, res) => {
  const created = await Registration.create(writableOnly(req.body));
  res.status(201).json({ success: true, message: "Registration successful", data: created });
}));

router.get("/", catchAsync(async (req, res) => {
  const { eventType, status } = req.query;
  const problems = [];
  if (eventType && !EVENTS.includes(eventType)) problems.push(`eventType must be one of ${EVENTS.join(", ")}`);
  if (status && !STATES.includes(status)) problems.push(`status must be one of ${STATES.join(", ")}`);
  if (problems.length) throw new ApiError(400, "Invalid filters", problems);

  const query = {};
  if (eventType) query.eventType = eventType;
  if (status) query.status = status;
  const items = await Registration.find(query).sort({ registrationDate: -1 });
  res.status(200).json({ success: true, count: items.length, data: items });
}));

router.get("/:id", catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: await loadOr404(req.params.id) });
}));

router.put("/:id", catchAsync(async (req, res) => {
  const changes = writableOnly(req.body);
  if (!Object.keys(changes).length) throw new ApiError(400, "Nothing to update");
  const doc = await loadOr404(req.params.id);
  doc.set(changes);
  await doc.save();
  res.status(200).json({ success: true, message: "Registration updated", data: doc });
}));

router.delete("/:id", catchAsync(async (req, res) => {
  const doc = await loadOr404(req.params.id);
  await doc.deleteOne();
  res.status(200).json({ success: true, message: "Registration deleted", data: doc });
}));

const app = express();
app.use(express.json());
app.use("/api/registrations", router);

const sendError = (res, status, message, errors) =>
  res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });

app.use((req, res) => sendError(res, 404, `No route for ${req.method} ${req.originalUrl}`));

app.use((err, req, res, next) => {
  if (err instanceof ApiError) return sendError(res, err.status, err.message, err.details);

  if (err.code === 11000) {
    return sendError(res, 409, "This email is already registered for the event");
  }
  if (err instanceof MongooseError.ValidationError) {
    const errors = Object.values(err.errors).map((e) =>
      e instanceof MongooseError.CastError ? `${e.path} has an invalid value` : e.message
    );
    return sendError(res, 400, "Validation failed", errors);
  }
  if (err instanceof MongooseError.CastError) {
    return sendError(res, 400, err.path === "_id" ? "Invalid registration ID format" : `${err.path} has an invalid value`);
  }
  if (err.type === "entity.parse.failed") return sendError(res, 400, "Request body is not valid JSON");

  console.error(err);
  return sendError(res, 500, "Something went wrong on the server");
});

mongoose
  .connect(MONGO_URI)
  .then(() => Registration.init())
  .then(() => app.listen(PORT, () => console.log(`API listening on :${PORT}`)))
  .catch((e) => {
    console.error("Startup failed:", e.message);
    process.exit(1);
  });
