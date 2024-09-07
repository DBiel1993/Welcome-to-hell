"use client"; // Ensures the use of client-side hooks

import React, { useEffect, useRef, useState } from "react";

// Define constants for grid size and game dimensions
const GRID_SIZE = 25;
const GRID_ROWS = 30; // Increased number of rows
const GRID_COLS = 30; // Increased number of columns
const MONSTER_SPEED = 1; // Speed of the monster
const DIAMOND_COUNT = 5; // Number of diamonds

// A* Pathfinding algorithm helper functions
const heuristic = (a: any, b: any) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const findLowestCostNode = (openSet: any) =>
  openSet.reduce((lowest: any, node: any) =>
    lowest.f < node.f ? lowest : node
  );

// Function to create random obstacles
const createObstacles = (count: number, width: number, height: number) => {
  const obstacles = [];
  for (let i = 0; i < count; i++) {
    obstacles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 30,
    });
  }
  return obstacles;
};

// Function to generate random diamonds
const createDiamonds = (count: number, width: number, height: number) => {
  const diamonds = [];
  for (let i = 0; i < count; i++) {
    diamonds.push({
      x: Math.random() * width,
      y: Math.random() * height,
    });
  }
  return diamonds;
};

// Define more wall segments for the maze, including rotations
const createMazeWalls = () => [
  { x: 50, y: 50, width: 700, height: 10 }, // Horizontal top
  { x: 50, y: 650, width: 700, height: 10 }, // Horizontal bottom
  { x: 50, y: 50, width: 10, height: 600 }, // Vertical left
  { x: 740, y: 50, width: 10, height: 600 }, // Vertical right
  { x: 250, y: 150, width: 300, height: 10 }, // Inner horizontal
  { x: 250, y: 400, width: 10, height: 250 }, // Inner vertical
  { x: 400, y: 250, width: 10, height: 250 }, // Additional inner vertical
  { x: 100, y: 500, width: 400, height: 10 }, // Additional horizontal
  // Rotated walls
  { x: 300, y: 100, width: 200, height: 10, rotation: 45 }, // Diagonal wall
  { x: 500, y: 300, width: 150, height: 10, rotation: -45 }, // Diagonal wall
];

// Grid-based pathfinding A* algorithm
const aStarPathfinding = (grid: any, start: any, goal: any) => {
  let openSet = [start];
  let cameFrom: any = {};

  start.g = 0;
  start.f = heuristic(start, goal);

  while (openSet.length > 0) {
    let current = findLowestCostNode(openSet);

    if (current.x === goal.x && current.y === goal.y) {
      // Reconstruct path
      let path: any[] = [];
      while (current) {
        path.push(current);
        current = cameFrom[`${current.x},${current.y}`];
      }
      return path.reverse(); // Return path from start to goal
    }

    openSet = openSet.filter((n) => n !== current);

    const neighbors = getNeighbors(current, grid);
    for (let neighbor of neighbors) {
      let tentative_g = current.g + 1;

      if (tentative_g < neighbor.g) {
        cameFrom[`${neighbor.x},${neighbor.y}`] = current;
        neighbor.g = tentative_g;
        neighbor.f = tentative_g + heuristic(neighbor, goal);

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return []; // Return an empty path if no path is found
};

const getNeighbors = (node: any, grid: any) => {
  const { x, y } = node;
  const neighbors = [];
  const directions = [
    { x: 0, y: -1 }, // Up
    { x: 0, y: 1 }, // Down
    { x: -1, y: 0 }, // Left
    { x: 1, y: 0 }, // Right
  ];

  for (let dir of directions) {
    const nx = x + dir.x;
    const ny = y + dir.y;

    if (
      nx >= 0 &&
      nx < GRID_COLS &&
      ny >= 0 &&
      ny < GRID_ROWS &&
      !grid[ny][nx].isWall
    ) {
      neighbors.push(grid[ny][nx]);
    }
  }

  return neighbors;
};

const createGrid = (walls: any) => {
  let grid = Array.from({ length: GRID_ROWS }, (_, y) =>
    Array.from({ length: GRID_COLS }, (_, x) => ({
      x,
      y,
      g: Infinity,
      f: Infinity,
      isWall: false,
    }))
  );

  walls.forEach((wall: any) => {
    for (
      let row = Math.floor(wall.y / GRID_SIZE);
      row < Math.floor((wall.y + wall.height) / GRID_SIZE);
      row++
    ) {
      for (
        let col = Math.floor(wall.x / GRID_SIZE);
        col < Math.floor((wall.x + wall.width) / GRID_SIZE);
        col++
      ) {
        // Boundary check: Ensure that row and col are within grid bounds
        if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
          grid[row][col].isWall = true;
        }
      }
    }
  });

  return grid;
};

const GamePage = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [position, setPosition] = useState({ x: 250, y: 250 }); // Devil's position
  const [monsterPosition, setMonsterPosition] = useState({ x: 100, y: 100 }); // Monster's position
  const [goalPosition] = useState({ x: 650, y: 600 }); // Goal position
  const [obstacles, setObstacles] = useState(createObstacles(10, 750, 650)); // More random obstacles
  const [diamonds, setDiamonds] = useState(
    createDiamonds(DIAMOND_COUNT, 750, 650)
  ); // Generate diamonds
  const [walls, setWalls] = useState(createMazeWalls()); // Maze walls
  const [grid, setGrid] = useState(createGrid(walls)); // Game grid for pathfinding
  const [score, setScore] = useState(0); // Player's score
  const [message, setMessage] = useState(""); // Message to display points
  const [gameOver, setGameOver] = useState(false);
  const speed = 5; // Movement speed
  const canvasSize = 750; // Canvas dimensions

  // Handle devil movement and check for wall collisions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameOver) return; // Stop movement if game is over

      let newX = position.x;
      let newY = position.y;

      switch (event.key) {
        case "ArrowUp":
          newY = Math.max(0, position.y - speed); // Prevent going out of bounds
          break;
        case "ArrowDown":
          newY = Math.min(canvasSize - 20, position.y + speed);
          break;
        case "ArrowLeft":
          newX = Math.max(0, position.x - speed);
          break;
        case "ArrowRight":
          newX = Math.min(canvasSize - 20, position.x + speed);
          break;
      }

      // Check if the new position collides with any walls
      if (!checkWallCollision(newX, newY)) {
        setPosition({ x: newX, y: newY }); // Update position only if no collision
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [position, gameOver]);

  // Function to check for collision with walls
  const checkWallCollision = (x: number, y: number) => {
    for (let i = 0; i < walls.length; i++) {
      const wall = walls[i];
      if (
        x + 20 > wall.x &&
        x - 20 < wall.x + wall.width &&
        y + 20 > wall.y &&
        y - 20 < wall.y + wall.height
      ) {
        return true; // Collision with a wall
      }
    }
    return false; // No collision with walls
  };

  // Detect collision with obstacles
  const checkObstacleCollision = () => {
    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i];
      const distance = Math.hypot(
        position.x - obstacle.x,
        position.y - obstacle.y
      );
      if (distance < 20 + obstacle.size / 2) {
        return true; // Collision detected
      }
    }
    return false; // No collision
  };

  // Detect collision with diamonds
  const checkDiamondCollision = () => {
    const newDiamonds = diamonds.filter((diamond) => {
      const distance = Math.hypot(
        position.x - diamond.x,
        position.y - diamond.y
      );
      if (distance < 30) {
        setScore((prevScore) => prevScore + 1); // Increment score
        setMessage(`Diamond collected! Total Points: ${score + 1}`); // Display message
        setTimeout(() => setMessage(""), 2000); // Clear message after 2 seconds
        return false; // Remove diamond
      }
      return true; // Keep diamond
    });
    setDiamonds(newDiamonds);
  };

  // Detect collision with the monster
  const checkMonsterCollision = () => {
    const distance = Math.hypot(
      position.x - monsterPosition.x,
      position.y - monsterPosition.y
    );
    return distance < 30; // Collision if close enough to the player
  };

  // Check if player reaches the goal
  const checkGoalReached = () => {
    const distance = Math.hypot(
      position.x - goalPosition.x,
      position.y - goalPosition.y
    );
    return distance < 30; // Win if close enough to the goal
  };

  // Move the monster using pathfinding
  const moveMonster = () => {
    const start =
      grid[Math.floor(monsterPosition.y / GRID_SIZE)][
        Math.floor(monsterPosition.x / GRID_SIZE)
      ];
    const goal =
      grid[Math.floor(position.y / GRID_SIZE)][
        Math.floor(position.x / GRID_SIZE)
      ];
    const path = aStarPathfinding(grid, start, goal);

    if (path.length > 1) {
      const nextStep = path[1];
      const newX = nextStep.x * GRID_SIZE + GRID_SIZE / 2;
      const newY = nextStep.y * GRID_SIZE + GRID_SIZE / 2;
      setMonsterPosition({ x: newX, y: newY });
    }
  };

  // Update the game (e.g., check for collisions, move monster)
  useEffect(() => {
    const gameLoop = setInterval(() => {
      if (checkObstacleCollision() || checkMonsterCollision()) {
        setGameOver(true);
        alert("Game Over!"); // Show Game Over message
        setScore(0); // Reset score
        setPosition({ x: 250, y: 250 }); // Reset devil's position
        setMonsterPosition({ x: 100, y: 100 }); // Reset monster's position
        setObstacles(createObstacles(10, 750, 650)); // Create new obstacles
        setDiamonds(createDiamonds(DIAMOND_COUNT, 750, 650)); // Create new diamonds
      } else if (checkGoalReached()) {
        setGameOver(true);
        alert("You Win!"); // Show "You Win" message
      } else {
        checkDiamondCollision(); // Check if the player collects a diamond
        moveMonster(); // Move the monster towards the player using pathfinding
      }
    }, 300); // Slow down the game loop a bit to make monster movement smoother

    return () => clearInterval(gameLoop);
  }, [position, obstacles, monsterPosition, grid, diamonds]);

  // Draw the game (devil, monster, obstacles, walls, diamonds, score, goal)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Set black background
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add glowing lava-like spots
        ctx.fillStyle = "rgba(255, 69, 0, 0.7)";
        for (let i = 0; i < 10; i++) {
          const lavaX = Math.random() * canvas.width;
          const lavaY = Math.random() * canvas.height;
          const lavaSize = Math.random() * 50 + 20;
          ctx.beginPath();
          ctx.arc(lavaX, lavaY, lavaSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw the devil (player)
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(position.x, position.y, 20, 0, Math.PI * 2); // Head
        ctx.fill();

        // Draw eyes
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(position.x - 8, position.y - 5, 4, 0, Math.PI * 2); // Left eye
        ctx.arc(position.x + 8, position.y - 5, 4, 0, Math.PI * 2); // Right eye
        ctx.fill();

        // Draw the body
        ctx.fillStyle = "black";
        ctx.fillRect(position.x - 10, position.y + 10, 20, 30); // Body

        // Draw the monster as a scary shape
        ctx.fillStyle = "darkred";
        ctx.beginPath();
        ctx.moveTo(monsterPosition.x, monsterPosition.y - 30); // Top point
        ctx.lineTo(monsterPosition.x - 40, monsterPosition.y + 40); // Bottom-left point
        ctx.lineTo(monsterPosition.x + 40, monsterPosition.y + 40); // Bottom-right point
        ctx.closePath();
        ctx.fill();

        // Draw monster's eyes
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(
          monsterPosition.x - 10,
          monsterPosition.y - 10,
          6,
          0,
          Math.PI * 2
        ); // Left eye
        ctx.arc(
          monsterPosition.x + 10,
          monsterPosition.y - 10,
          6,
          0,
          Math.PI * 2
        ); // Right eye
        ctx.fill();

        // Draw the goal
        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.arc(goalPosition.x, goalPosition.y, 30, 0, Math.PI * 2); // Goal
        ctx.fill();

        // Draw diamonds
        diamonds.forEach((diamond) => {
          ctx.fillStyle = "blue";
          ctx.beginPath();
          ctx.moveTo(diamond.x, diamond.y - 10); // Top
          ctx.lineTo(diamond.x - 10, diamond.y); // Bottom-left
          ctx.lineTo(diamond.x, diamond.y + 10); // Bottom
          ctx.lineTo(diamond.x + 10, diamond.y); // Bottom-right
          ctx.closePath();
          ctx.fill();
        });

        // Draw the walls with rotation
        walls.forEach((wall) => {
          ctx.save(); // Save the context state
          if (wall.rotation) {
            ctx.translate(wall.x + wall.width / 2, wall.y + wall.height / 2); // Translate to center of the wall
            ctx.rotate((wall.rotation * Math.PI) / 180); // Rotate the wall
            ctx.translate(
              -(wall.x + wall.width / 2),
              -(wall.y + wall.height / 2)
            ); // Translate back
          }
          ctx.fillStyle = "brown";
          ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
          ctx.restore(); // Restore the context state after rotation
        });

        // Draw the obstacles as flame-like shapes
        obstacles.forEach((obstacle) => {
          const flameColors = ["#ff4500", "#ff8c00", "#ffae42"]; // Flame colors (orange, yellow, red)
          const flameHeight = obstacle.size * 1.5; // Make flames taller
          const flameWidth = obstacle.size;

          ctx.save();
          ctx.translate(obstacle.x, obstacle.y);

          // Draw multiple layers of flame
          for (let i = 0; i < flameColors.length; i++) {
            ctx.fillStyle = flameColors[i];
            ctx.beginPath();
            ctx.moveTo(0, 0);

            // Create a wavy shape to simulate a flame
            ctx.quadraticCurveTo(
              -flameWidth * 0.5,
              -flameHeight * 0.25,
              0,
              -flameHeight * 0.5
            );
            ctx.quadraticCurveTo(flameWidth * 0.5, -flameHeight * 0.25, 0, 0);

            ctx.closePath();
            ctx.fill();

            // Shrink the flame for each layer
            ctx.scale(0.8, 0.8);
          }

          ctx.restore();
        });

        // Draw the score in the top-left corner
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText(`Score: ${score}`, 10, 30);
      }
    }
  }, [
    position,
    obstacles,
    monsterPosition,
    walls,
    diamonds,
    score,
    goalPosition,
  ]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        backgroundColor: "black",
      }}
    >
      <canvas
        ref={canvasRef}
        width={750}
        height={650}
        style={{ border: "1px solid black", backgroundColor: "black" }}
      />
      {message && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            color: "yellow",
            fontSize: "30px",
            fontFamily: "Arial, sans-serif",
            textAlign: "center",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default GamePage;
