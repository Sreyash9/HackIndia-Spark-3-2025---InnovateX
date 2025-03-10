import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./dropdown-menu";
import { Avatar, AvatarFallback } from "./avatar";
import { Settings, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  const initials = user.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Mindlancer
              </span>
            </Link>
            <div className="flex space-x-4">
              <Link href="/jobs">
                <Button variant="ghost">Browse Jobs</Button>
              </Link>
              {user.role === "business" && (
                <Link href="/post-job">
                  <Button variant="ghost">Post a Job</Button>
                </Link>
              )}
              {user.role === "freelancer" && (
                <Link href="/portfolio">
                  <Button variant="ghost">My Portfolio</Button>
                </Link>
              )}
              {user.role === "admin" && (
                <Link href="/admin">
                  <Button variant="ghost">Admin Dashboard</Button>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.username}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {user.role === "freelancer" && (
                  <DropdownMenuItem asChild>
                    <Link href="/portfolio">My Portfolio</Link>
                  </DropdownMenuItem>
                )}
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}