CREATE DATABASE IF NOT EXISTS math_quest_game
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE math_quest_game;

CREATE TABLE IF NOT EXISTS scores (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  player_name VARCHAR(80) NOT NULL,
  score INT NOT NULL,
  moves INT UNSIGNED NOT NULL,
  correct_answers INT UNSIGNED NOT NULL,
  wrong_answers INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_scores_rank (score DESC, moves ASC, created_at ASC)
) ENGINE=InnoDB;
