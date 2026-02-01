import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { full_name, email } = await req.json();
    const name = full_name || "சகோதரரே / சகோதரியே";

    if (!email) {
      throw new Error("Email is required");
    }

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

    const currentYear = new Date().getFullYear();
    const subject = "தேவ கிருபையினால் 70 நாட்களில் வேதாகம வாசிப்பு முயற்சி / 70-day journey of reading the Bible by God’s grace.";
    
    const html = `
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
          <li style="margin-bottom: 8px;"><strong>தொடர்புக்கு:</strong> ஏதேனும் சந்தேகங்கள் இருந்தால் போதகர். ஜிம்ஸ் ஆசீர்வாதம் (<strong>+91 99651 14141</strong> & <strong>+91 99524 62889</strong>) அவர்களைத் தொடர்பு கொள்ளவும்.</li>
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
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 10px;">
            <tr>
              <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 0 10px;">
                      <a href="https://athumanesarindia.com/" style="color: #64748b; text-decoration: none; font-size: 0.8rem; vertical-align: middle;">
                        <img src="https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://athumanesarindia.com&size=64" width="18" height="18" style="margin-right: 5px; border-radius: 4px; vertical-align: middle;">
                        Website
                      </a>
                    </td>
                    <td style="color: #e2e8f0;">|</td>
                    <td style="padding: 0 10px;">
                      <a href="https://www.youtube.com/@ATHUMANESARINDIA" style="color: #64748b; text-decoration: none; font-size: 0.8rem; vertical-align: middle;">
                        <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" width="18" height="18" style="margin-right: 5px; vertical-align: middle;">
                        Youtube
                      </a>
                    </td>
                    <td style="color: #e2e8f0;">|</td>
                    <td style="padding: 0 10px;">
                      <a href="https://whatsapp.com/channel/0029VbBq0sV6BIErAtoINI2g" style="color: #64748b; text-decoration: none; font-size: 0.8rem; vertical-align: middle;">
                        <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" width="18" height="18" style="margin-right: 5px; vertical-align: middle;">
                        WhatsApp
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 2rem; background: #f8fafc; padding: 1rem; border-radius: 0.75rem; border: 1px dashed #e2e8f0;">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem;">70-Day Bible Reading Contest Portal</h4>
          <p style="font-size: 0.7rem; color: #64748b; margin-bottom: 0.75rem;">(Scan to login or click the link)</p>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://preview--verse-planner-app.lovable.app/login" alt="QR Code" style="margin-bottom: 1rem; border: 4px solid white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 100px; height: 100px;">
          <br>
          <a href="https://preview--verse-planner-app.lovable.app/login" style="background: #1e3a8a; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 0.4rem; font-size: 0.85rem; font-weight: bold; display: inline-block;">Login to Planner</a>
        </div>

        <div style="text-align: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #f1f5f9;">
          <p style="color: #1e3a8a; font-weight: bold; letter-spacing: 2px; font-size: 0.9rem; margin-bottom: 5px;">
            COPYRIGHTS RESERVED
          </p>
          <p style="color: #475569; font-weight: 600; font-size: 0.85rem; margin: 0;">
            UNITED CHRISTIAN BELIEVERS FELLOWSHIP (UCBF)
          </p>
          <p style="color: #94a3b8; font-size: 0.7rem; margin-top: 10px;">
            &copy; ${currentYear} Athumanesar India Ministries. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: SMTP_USER,
      to: email,
      subject: subject,
      html: html,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
