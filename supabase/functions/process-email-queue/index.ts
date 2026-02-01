import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MailQueueItem {
  id: string;
  recipient_email: string;
  recipient_name: string;
  attempts: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Setup Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // specific service role key needed for queue updates
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Setup SMTP
    const SMTP_USER = Deno.env.get("SMTP_USER");
    const SMTP_PASS = Deno.env.get("SMTP_PASS");

    if (!SMTP_USER || !SMTP_PASS) {
      throw new Error("SMTP credentials not configured");
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // 3. Fetch Pending Items
    // Limit to 20 to prevent timeout
    const { data: queueItems, error: fetchError } = await supabase
      .from('mail_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(20);

    if (fetchError) throw fetchError;

    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({ message: "No pending emails to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${queueItems.length} emails...`);

    let quotaExceeded = false;
    const results = [];

    // Helper to generate content (reused from send-welcome-email)
    const getHtml = (name: string) => {
        const currentYear = new Date().getFullYear();
        return `
<div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
        <h2 style="color: #1e3a8a;">அன்புள்ள ${name},</h2>
        
        <p> நம் ஆண்டவராகிய <strong>இயேசு கிறிஸ்துவின் நாமத்தில் அப்போஸ்தலர். டி. ஆசீர்வாதம்</strong> அவர்களின் வாழ்த்துக்கள்.</p>
        
        <p>70 நாட்கள் வேதாகம வாசிப்பு சவாலுக்கு உங்களை இதயம் கனிந்த வரவேற்புடன் அழைக்கிறோம். <strong>தேவனுடைய வார்த்தையில்</strong> ஆழ்ந்து வளரவும் நம் ஆவிக்குரிய வாழ்க்கையை வலுப்படுத்தவும் உதவும் அருமையான ஆவிக்குரிய பயணம் இதுவாகும்.</p>
        
        <blockquote style="border-left: 4px solid #fbbf24; padding-left: 1rem; font-style: italic; background: #fffcf0; padding: 10px; margin: 15px 0;">
          “என்னோடேகூடக் கர்த்தரை மகிமைப்படுத்துங்கள்; நாம் ஒருமித்து அவர் <strong>(இயேசு கிறிஸ்துவின்) நாமத்தை உயர்த்துவோமாக.</strong>” சங்கீதம் 34:3
        </blockquote>
        
        <p>இந்த முயற்சி  <strong>போதகர். ஜிம்ஸ் ஆசீர்வாதம்</strong> அவர்களால் ஏற்பாடு செய்யப்பட்டுள்ளது. மேலும் இது <strong>போதகர். A.J.I.சாம் (திருச்சி)</strong> அவர்களால் வழங்கப்பட்டது. இந்த ஆசீர்வாதமான முயற்சியில் நீங்கள் பங்கு பெறுவது எங்களுக்கு மிக்க மகிழ்ச்சி.</p>
        
        <h3 style="color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">முக்கிய குறிப்புகள்:</h3>
        <ul style="padding-left: 20px;">
          <li style="margin-bottom: 8px;"><strong>தினசரி பதிவு:</strong> 70 நாட்களும் தினமும் உள்நுழைவதை மறவாதீர்கள். ஒவ்வொரு நாளும் உங்களுக்கு வழங்கப்பட்ட வேதாகம வாசிப்பை முடித்த பிறகு, அந்த நாளுக்கான வாசிப்புப் பகுதியைச் சுருக்கமாக (அதிகபட்சம் 1000 எழுத்துக்கள்) விவரித்து, பின் குறியீட்டு பெட்டியை (✅checkbox) குறிக்கவும்.</li>
          <li style="margin-bottom: 8px;"><strong>சான்றிதழ்கள்:</strong> இந்த சவாலில் பங்கேற்கும் அனைவருக்கும் பங்கேற்பு சான்றிதழ் மற்றும் வெற்றிகரமாக முடிப்பவர்களுக்கு சாதனைச் சான்றிதழ் வழங்கப்படும்.</li>
          <li style="margin-bottom: 8px;"><strong>தொடர்புக்கு:</strong> ஏதேனும் சந்தேகங்கள் இருந்தால் போதகர். ஜிம்ஸ் ஆசீர்வாதம் (<strong>+91 99651 14141</strong>) அவர்களைத் தொடர்பு கொள்ளவும்.</li>
          <li style="margin-bottom: 8px;"><strong>அறிவிப்புகள்:</strong> ஆத்துமநேசர் தலைமைசபையின் அனைத்து அறிவிப்புகளும் மற்றும் வரவிருக்கும் நிகழ்வுகளும் கீழே உள்ள வாட்ஸ்அப் (WhatsApp) இணைப்பின் மூலம் தெரிவிக்கப்படும்.</li>
        </ul>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 2rem 0;">
        
        <h2 style="color: #1e3a8a;">Dear ${name},</h2>
        
        <p>Greetings from <strong>Apostle. D. Asirvatham in the name of our Lord Jesus Christ.</strong></p>
        
        <p>We are delighted to welcome you to the <strong>70-Days Bible Reading Challenge</strong>.</p>
        
        <blockquote style="border-left: 4px solid #fbbf24; padding-left: 1rem; font-style: italic; background: #fffcf0; padding: 10px; margin: 15px 0;">
          “O magnify the LORD with me, and let us exalt His name <strong>(JESUS CHRIST)</strong> together.” Psalms 34:3
        </blockquote>
        
        <p>This initiative is organized by <strong>Pastor Jims Asirvatham</strong> and presented by <strong>Pastor A.J.I.Sam (Tiruchirappalli)</strong>. We are very happy to have you participate in this blessed initiative.</p>
        
        <h3 style="color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">Important Notes:</h3>
        <ul style="padding-left: 20px;">
          <li style="margin-bottom: 8px;"><strong>Daily Log:</strong> Please log in daily for 70 consecutive days. Provide a short description of your reading (<strong>max 1000 characters</strong>) and check (✅) the checkbox to record progress.</li>
          <li style="margin-bottom: 8px;"><strong>Certificates:</strong> We will provide a <strong>Participation Certificate</strong> to all candidates and a <strong>Completion Certificate</strong> to those who successfully finish the challenge.</li>
          <li style="margin-bottom: 8px;"><strong>Contact:</strong> For any queries, contact Pastor Jims Asirvatham at <strong>+91 99651 14141</strong> and <strong>+91 99524 62889</strong>.</li>
          <li style="margin-bottom: 8px;"><strong>Updates:</strong> All church updates and upcoming events will be notified through our WhatsApp channel: <a href="https://whatsapp.com/channel/0029VbBq0sV6BIErAtoINI2g">Join WhatsApp Group</a></li>
        </ul>
        
        <p style="margin-top: 2rem;">With prayers and loving regards,<br>
        <strong>Pastor. Jims Asirvatham.</strong></p>
        
        <div style="text-align: center; margin-top: 2rem; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 1rem;">
          <p style="margin-bottom: 10px;">
            Athumanesar Ministries, 17, Manickam Nagar, M.C. Road, Thanjavur - 613007, TN, INDIA
          </p>
          <p style="margin-top: 10px; display: flex; justify-content: center; align-items: center; gap: 15px; flex-wrap: wrap;">
            <a href="https://athumanesarindia.com/" style="color: #64748b; text-decoration: none; display: inline-flex; align-items: center;">
              <img src="https://cdn-icons-png.flaticon.com/32/1006/1006771.png" width="16" height="16" style="margin-right: 5px;"> Website
            </a>
            <span style="color: #e2e8f0;">|</span>
            <a href="https://www.youtube.com/@ATHUMANESARINDIA" style="color: #64748b; text-decoration: none; display: inline-flex; align-items: center;">
              <img src="https://cdn-icons-png.flaticon.com/32/1384/1384060.png" width="16" height="16" style="margin-right: 5px;"> Youtube
            </a>
            <span style="color: #e2e8f0;">|</span>
            <a href="https://whatsapp.com/channel/0029VbBq0sV6BIErAtoINI2g" style="color: #64748b; text-decoration: none; display: inline-flex; align-items: center;">
              <img src="https://cdn-icons-png.flaticon.com/32/733/733585.png" width="16" height="16" style="margin-right: 5px;"> WhatsApp
            </a>
          </p>
          <p>&copy; ${currentYear} Athumanesar India Ministries. All rights reserved.</p>
        </div>

        <div style="text-align: center; margin-top: 2rem; background: #f8fafc; padding: 1rem; border-radius: 0.75rem; border: 1px dashed #e2e8f0;">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem;">70-Day Bible Reading Contest Portal</h4>
          <p style="font-size: 0.7rem; color: #64748b; margin-bottom: 0.75rem;">(Scan to login or click the link)</p>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://preview--verse-planner-app.lovable.app/login" alt="QR Code" style="margin-bottom: 1rem; border: 4px solid white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 80px; height: 80px;">
          <br>
          <a href="https://preview--verse-planner-app.lovable.app/login" style="background: #1e3a8a; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 0.4rem; font-size: 0.85rem; font-weight: bold; display: inline-block;">Login to Planner</a>
        </div>
      </div>
    `;
    };

    // 4. Process Loop
    for (const item of queueItems) {
      if (quotaExceeded) {
        // Stop processing, let the rescheduling logic below handle it
        break;
      }

      try {
        await transporter.sendMail({
          from: SMTP_USER,
          to: item.recipient_email,
          subject: item.subject || "Welcome to 70-Day Bible Reading Challenge",
          html: item.body_html || getHtml(item.recipient_name || "Participant"),
        });

        // Success
        await supabase
          .from('mail_queue')
          .update({ 
            status: 'sent', 
            updated_at: new Date().toISOString(),
            last_attempted_at: new Date().toISOString()
          })
          .eq('id', item.id);
        
        // Also update profiles table if it's a welcome email
        await supabase
          .from('profiles')
          .update({ welcome_email_sent: true })
          .eq('email', item.recipient_email);

        results.push({ id: item.id, status: 'sent' });

      } catch (error: any) {
        console.error(`Failed to send to ${item.recipient_email}:`, error);

        // Check for Quota Error
        // Gmail 450-4.2.1, 550 5.4.5, or code='EAUTH' sometimes
        const isQuotaError = 
          (error.response && error.response.includes('quota')) || 
          (error.response && error.response.includes('limit')) ||
          (error.response && error.response.includes('421')) || // Service not available (often rate limit)
          error.command === 'DATA'; // Often fails here if limit hit

        if (isQuotaError) {
          quotaExceeded = true;
          console.warn("QUOTA EXCEEDED DETECTED. Stopping batch.");
          
          // Reschedule CURRENT item
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(8, 0, 0, 0); // 8 AM next day

          await supabase
            .from('mail_queue')
            .update({ 
              status: 'pending', 
              scheduled_for: tomorrow.toISOString(),
              last_attempted_at: new Date().toISOString(),
              error_message: `Quota Exceeded: ${error.message}`
            })
            .eq('id', item.id);
            
           results.push({ id: item.id, status: 'deferred', reason: 'quota' });

        } else {
           // Standard Error - Retry later? Or fail?
           // Let's increment attempts. If < 3, retry in 1 hour. Else failed.
           const retry = item.attempts < 3;
           const nextSchedule = new Date();
           nextSchedule.setHours(nextSchedule.getHours() + 1);

           await supabase
            .from('mail_queue')
            .update({ 
              status: retry ? 'pending' : 'failed',
              attempts: item.attempts + 1,
              scheduled_for: retry ? nextSchedule.toISOString() : item.scheduled_for,
              last_attempted_at: new Date().toISOString(),
              error_message: error.message
            })
            .eq('id', item.id);

           results.push({ id: item.id, status: retry ? 'retrying' : 'failed', error: error.message });
        }
      }

      // Rate limit delay
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // 5. If Quota Exceeded, Reschedule ALL pending items in the future
    if (quotaExceeded) {
       const tomorrow = new Date();
       tomorrow.setDate(tomorrow.getDate() + 1);
       tomorrow.setHours(9, 0, 0, 0); // Batch 2 starts at 9 AM

       const { count } = await supabase
         .from('mail_queue')
         .update({ 
           scheduled_for: tomorrow.toISOString(),
           error_message: "Rescheduled due to daily quota limit on previous batch"
         })
         .eq('status', 'pending')
         .lte('scheduled_for', new Date().toISOString());
      
      console.log(`Rescheduled ${count} remaining items to ${tomorrow.toISOString()}`);
    }

    return new Response(JSON.stringify({ success: true, results, quotaExceeded }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
