# Gym Buddy

Interactive gym website with login/signup, membership registration, and BMI-based workout and diet planning.

## Tech stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Database:** SQLite

## Local development

```bash
npm install
npm start
```

Open [http://localhost:8000](http://localhost:8000).

## Deploy

### GitHub

Repository: [https://github.com/29SalahMo/Gym](https://github.com/29SalahMo/Gym)

### Vercel

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Other**
3. Build command: leave empty
4. Output directory: leave empty
5. Deploy

Vercel runs `server.js` as a Node.js serverless function. SQLite uses `/tmp` on Vercel (data may reset between cold starts).
