import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Email transporter setup (using a mock or placeholder for now, 
  // user will need to provide real credentials in .env)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || "webtasky@gmail.com",
      pass: (process.env.EMAIL_PASS || "qohu zxtk ottw wluc").replace(/\s+/g, ""),
    }
  });

  // Ensure upload directories exist
  const uploadDir = path.join(process.cwd(), "uploads");
  const thumbDir = path.join(uploadDir, "thumbs");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir);

  // Multer setup
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  });
  const upload = multer({ storage });

  app.use(express.json());
  app.use("/uploads", express.static("uploads"));

  // API Routes
  app.post("/api/upload", upload.single("image"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const imagePath = req.file.path;
      const faces = req.body.faces ? JSON.parse(req.body.faces) : [];
      
      // Basic optimization and resizing
      const processedName = "processed-" + req.file.filename;
      const processedPath = path.join(uploadDir, processedName);
      
      let image = sharp(imagePath);
      const metadata = await image.metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;

      if (faces && faces.length > 0 && width > 0 && height > 0) {
        const composites = await Promise.all(faces.map(async (face: number[]) => {
          const [ymin, xmin, ymax, xmax] = face;
          const left = Math.floor((xmin / 1000) * width);
          const top = Math.floor((ymin / 1000) * height);
          const w = Math.floor(((xmax - xmin) / 1000) * width);
          const h = Math.floor(((ymax - ymin) / 1000) * height);

          // Extract face, blur it, and return as composite object
          const faceBuffer = await sharp(imagePath)
            .extract({ left, top, width: w, height: h })
            .blur(20)
            .toBuffer();
          
          return { input: faceBuffer, left, top };
        }));

        image = image.composite(composites);
      }

      await image
        .resize(800, 800, { fit: 'inside' })
        .toFile(processedPath);

      res.json({
        imageUrl: `/uploads/${processedName}`,
        filename: processedName
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to process image" });
    }
  });

  app.post("/api/notify-registration", async (req, res) => {
    const { username, email, userType } = req.body;
    const adminEmail = "spidereg2010@gmail.com";

    let emailSent = false;
    let emailError = null;

    try {
      // Check if credentials exist and are not placeholders
      const hasCredentials = (process.env.EMAIL_USER || "webtasky@gmail.com") && 
                           (process.env.EMAIL_PASS || "qohu zxtk ottw wluc") && 
                           !process.env.EMAIL_USER?.includes("your-email");

      if (hasCredentials) {
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER || "webtasky@gmail.com",
            to: adminEmail,
            subject: `Νέα αίτηση εγγραφής: ${username}`,
            text: `Μια νέα αίτηση εγγραφής υποβλήθηκε στο Zero Hunger PGL.\n\nΌνομα χρήστη: ${username}\nEmail: ${email}\nΤύπος: ${userType === 'donor' ? 'Δωρητής' : 'Παραλήπτης'}\n\nΜπορείτε να εγκρίνετε την αίτηση εδώ: ${process.env.APP_URL}/admin`,
          });
          emailSent = true;
        } catch (mailError) {
          console.error("Email delivery failed:", mailError);
          emailError = mailError instanceof Error ? mailError.message : String(mailError);
        }
      } else {
        console.log("Email notification skipped: Credentials missing or using placeholders.");
      }

      // Always return success for the registration itself
      res.json({ 
        success: true, 
        emailSent,
        warning: emailError ? "Η εγγραφή έγινε, αλλά η ειδοποίηση email απέτυχε." : null
      });
    } catch (error) {
      console.error("Registration endpoint error:", error);
      res.status(500).json({ error: "Internal server error during registration" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
