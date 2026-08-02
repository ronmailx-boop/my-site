# Project State — App Launcher (GitHub Repos Aggregator)

## Current Focus
האפליקציה הוחלפה מרשימת קניות למסך "אפליקציות" שמאגד את כל הריפוזיטוריז הציבוריים מ-GitHub (`ronmailx-boop`) כאייקונים לחיצים, בהשראת מסך Apps של כרום באנדרואיד. הרשימה נטענת דינמית מול `api.github.com` בכל טעינת עמוד (ללא hardcoding), כך שריפו חדש מופיע אוטומטית. לכל אייקון יש ניסיון טעינת favicon מה-GitHub Pages של הריפו, עם נפילה חזרה לאריח צבעוני עם האות הראשונה. לחיצה על אייקון מובילה ל-GitHub Pages של אותו ריפו. הכל עלה ל-`claude/github-repos-aggregator-bi0jjv` וממתין לפריסה.

**הצעד הבא (אם ירצה):** אימות ידנית של האתר החי בדפדפן אמיתי (טעינת הריפואים בפועל, בדיקת fallback לאייקונים, RTL/מובייל) — לא ניתן היה לאמת זאת דרך הסביבה של Claude Code כי ה-proxy שלה חוסם גישה ל-github.io ול-api.github.com.

## Checklist
- [x] index.html: מסך "האפליקציות שלי" (RTL, Tailwind CDN, רקע כהה, מצבי טעינה/שגיאה/ריק)
- [x] app.js: fetch דינמי מול GitHub API (`/users/{username}/repos`)
- [x] app.js: סינון forks
- [x] app.js: רינדור גריד אייקונים + קישור ל-GitHub Pages של כל ריפו
- [x] app.js: fallback לאייקון (אות ראשונה + צבע לפי hash) כשאין favicon
- [x] טיפול בשגיאות רשת עם הודעה בעברית + כפתור נסה שוב
- [x] README.md עודכן לתיאור הפרויקט החדש
- [ ] אימות ידנית של האתר החי בדפדפן (כולל בדיקת ריפואים אמיתיים ו-favicons)
