# PowerShell script to split current unstaged/untracked files into a logical sequence of commits.
# This script will backdate the commits starting from ~12 hours ago, spaced 25 minutes apart.

# Make sure we are in git repository
if (-not (Test-Path .git)) {
    Write-Error "Not a git repository. Please run this script in the root of your git project."
    exit
}

# Initialize git repository if it has no commits
git init

# List of commit groups with their descriptions and files to add
$commits = @(
    @{
        Message = "chore: setup monorepo workspace configuration"
        Files   = @(
            "package.json",
            "package-lock.json",
            "turbo.json",
            ".gitignore",
            ".npmrc"
        )
    },
    @{
        Message = "config: add shared typescript and eslint configurations"
        Files   = @(
            "packages/eslint-config/README.md",
            "packages/eslint-config/base.js",
            "packages/eslint-config/next.js",
            "packages/eslint-config/package.json",
            "packages/eslint-config/react-internal.js",
            "packages/typescript-config/base.json",
            "packages/typescript-config/nextjs.json",
            "packages/typescript-config/package.json",
            "packages/typescript-config/react-library.json"
        )
    },
    @{
        Message = "feat(db): initialize database package configuration"
        Files   = @(
            "packages/db/package.json",
            "packages/db/tsconfig.json",
            "packages/db/.gitignore"
        )
    },
    @{
        Message = "feat(db): define Prisma schema with User, Space, and Map models"
        Files   = @(
            "packages/db/prisma/schema.prisma",
            "packages/db/src/index.ts"
        )
    },
    @{
        Message = "feat(http): setup express http server application boilerplate"
        Files   = @(
            "apps/http/package.json",
            "apps/http/tsconfig.json",
            "apps/http/global.d.ts",
            "apps/http/src/index.ts"
        )
    },
    @{
        Message = "feat(http): add configuration utilities and typescript types"
        Files   = @(
            "apps/http/src/types/index.ts",
            "apps/http/src/utils/config.ts"
        )
    },
    @{
        Message = "feat(http): implement admin and user authentication middleware"
        Files   = @(
            "apps/http/src/middleware/admin.ts",
            "apps/http/src/middleware/index.ts"
        )
    },
    @{
        Message = "feat(http): configure router framework and v1 entry point"
        Files   = @(
            "apps/http/src/routes/v1/index.ts"
        )
    },
    @{
        Message = "feat(http): implement admin routes for elements, maps, and avatars"
        Files   = @(
            "apps/http/src/routes/v1/admin.ts"
        )
    },
    @{
        Message = "feat(http): implement space creation and spatial layout routes"
        Files   = @(
            "apps/http/src/routes/v1/space.ts"
        )
    },
    @{
        Message = "feat(http): implement user profile and metadata management routes"
        Files   = @(
            "apps/http/src/routes/v1/user.ts"
        )
    },
    @{
        Message = "feat(websocket): initialize websocket server configuration"
        Files   = @(
            "apps/websocket/package.json",
            "apps/websocket/tsconfig.json",
            "apps/websocket/src/index.ts",
            "apps/websocket/src/utils/config.ts"
        )
    },
    @{
        Message = "feat(websocket): implement space and RoomManager coordination"
        Files   = @(
            "apps/websocket/src/RoomManager.ts"
        )
    },
    @{
        Message = "feat(websocket): add User class for socket tracking and message handling"
        Files   = @(
            "apps/websocket/src/User.ts"
        )
    },
    @{
        Message = "feat(websocket): implement optimized UserV2 movement tracking"
        Files   = @(
            "apps/websocket/src/UserV2.ts"
        )
    },
    @{
        Message = "feat(fe): bootstrap frontend react application with vite and configs"
        Files   = @(
            "apps/fe/package.json",
            "apps/fe/tsconfig.json",
            "apps/fe/tsconfig.app.json",
            "apps/fe/tsconfig.node.json",
            "apps/fe/vite.config.ts",
            "apps/fe/eslint.config.js",
            "apps/fe/index.html",
            "apps/fe/vite-env.d.ts",
            "apps/fe/.gitignore"
        )
    },
    @{
        Message = "feat(fe): import graphic assets, maps, and avatar icons"
        Files   = @(
            "apps/fe/public/classroom.jpg",
            "apps/fe/public/gAvatarV2.png",
            "apps/fe/public/icon.svg",
            "apps/fe/public/mAvatarV2.png",
            "apps/fe/public/vite.svg",
            "apps/fe/src/assets/react.svg"
        )
    },
    @{
        Message = "feat(fe): add authentication and avatar state context providers"
        Files   = @(
            "apps/fe/src/contexts/AuthContext.tsx",
            "apps/fe/src/contexts/AvatarsContext.tsx"
        )
    },
    @{
        Message = "feat(fe): implement login form and user update views"
        Files   = @(
            "apps/fe/src/pages/AuthForm.tsx",
            "apps/fe/src/pages/UserUpdate.tsx"
        )
    },
    @{
        Message = "feat(fe): implement avatar selection screen and main dashboard"
        Files   = @(
            "apps/fe/src/pages/AvatarSelection.tsx",
            "apps/fe/src/pages/Dashboard.tsx"
        )
    },
    @{
        Message = "feat(fe): implement space management and creation workspace panels"
        Files   = @(
            "apps/fe/src/pages/SpaceCreate.tsx",
            "apps/fe/src/pages/ManageSpace.tsx"
        )
    },
    @{
        Message = "feat(fe): design interactive 2D canvas Metaverse Arena interface"
        Files   = @(
            "apps/fe/src/pages/Arena.tsx"
        )
    },
    @{
        Message = "feat(fe): implement global layouts, routing, and app entry point"
        Files   = @(
            "apps/fe/src/index.css",
            "apps/fe/src/App.css",
            "apps/fe/src/App.tsx",
            "apps/fe/src/main.tsx"
        )
    },
    @{
        Message = "deployment: add Dockerfiles for backend, frontend, and websocket services"
        Files   = @(
            "docker/Dockerfile.backend",
            "docker/Dockerfile.frontend",
            "docker/Dockerfile.websocket"
        )
    },
    @{
        Message = "docs: add detailed project README explaining architecture and setup"
        Files   = @(
            "README.md"
        )
    }
)

# Start time: 12 hours ago
$startTime = (Get-Date).AddHours(-12)
$intervalMinutes = 25

Write-Host "Starting Git split-commits automation script..." -ForegroundColor Cyan

for ($i = 0; $i -lt $commits.Length; $i++) {
    $c = $commits[$i]
    $msg = $c.Message
    $files = $c.Files
    
    # Calculate backdate
    $commitTime = $startTime.AddMinutes($i * $intervalMinutes)
    $dateStr = $commitTime.ToString("yyyy-MM-ddTHH:mm:ss")
    
    # Set Git Date Environment Variables
    $env:GIT_AUTHOR_DATE = $dateStr
    $env:GIT_COMMITTER_DATE = $dateStr
    
    # Check if files exist and add them
    $filesToCommit = @()
    foreach ($file in $files) {
        if (Test-Path $file) {
            git add $file
            $filesToCommit += $file
        }
    }
    
    if ($filesToCommit.Count -gt 0) {
        Write-Host "[$($i + 1)/$($commits.Length)] Committing $msg ($dateStr)..." -ForegroundColor Yellow
        git commit -m $msg
    } else {
        Write-Host "[$($i + 1)/$($commits.Length)] No matching files found for: $msg. Skipping." -ForegroundColor DarkGray
    }
}

# Final catch-all for any missed files to ensure clean status
$remaining = git status --porcelain
if ($remaining) {
    # Set time to current time for clean up commit
    $env:GIT_AUTHOR_DATE = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    $env:GIT_COMMITTER_DATE = $env:GIT_AUTHOR_DATE
    
    Write-Host "Adding and committing remaining untracked/modified files..." -ForegroundColor Green
    git add .
    git commit -m "chore: clean up project structure and final workspace build artifacts"
}

# Clear env vars
Remove-Item Env:\GIT_AUTHOR_DATE -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

Write-Host "Finished making all commits successfully!" -ForegroundColor Green
Write-Host "To push to your github, configure your remote and run:" -ForegroundColor Cyan
Write-Host "  git remote add origin <your-repo-url>" -ForegroundColor Cyan
Write-Host "  git branch -M main" -ForegroundColor Cyan
Write-Host "  git push -u origin main --force" -ForegroundColor Cyan
