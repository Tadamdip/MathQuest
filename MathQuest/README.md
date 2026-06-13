# Math Quest Solo Challenge

A React, TypeScript, and Tailwind CSS version of the solo math board game. It includes a PHP API and MySQL schema for saving player scores with XAMPP.

## Run The Game

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Set Up The XAMPP Score Database

1. Start Apache and MySQL from the XAMPP Control Panel.
2. Open `http://localhost/phpmyadmin`.
3. Go to Import and choose `database/schema.sql`.
4. Copy the contents of `xampp-api` into `C:\xampp\htdocs\math-quest-api`.
5. Keep this URL as the default API endpoint:

```text
http://localhost/math-quest-api/scores.php
```

This XAMPP installation uses MySQL port `3307`, so `xampp-api/db.php` is already set to that port. If your XAMPP Control Panel shows a different MySQL port, update the `$port` value in `db.php`.

If your API URL is different, create a `.env` file and set:

```text
VITE_SCORE_API_URL=http://localhost/your-folder/scores.php
```

Restart `npm run dev` after changing `.env`.

## To Play the game
Just type your Name and you can start the Roll button
to see what the dice you got then it will ask what you get 
on the board either you got a multiplication operation, division, addition,
subtraction, fraction, percentage, probability and after you reach in board 15 and 
answer the last question, try to save your score to be saved in the database.