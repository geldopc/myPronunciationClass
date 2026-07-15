import { Link } from "@tanstack/react-router"
import { LogInIcon, LogOutIcon, TrendingUpIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/providers/Auth"

export function AuthControl() {
  const { user, signInWithGoogle, signOut } = useAuth()

  if (!user) {
    return (
      <Button
        id="auth-sign-in"
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void signInWithGoogle()}
        aria-label="Sign in"
      >
        <LogInIcon className="sm:hidden" />
        <span className="hidden sm:inline">Sign in</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id="auth-menu-trigger"
          type="button"
          variant="ghost"
          size="icon"
          aria-label={user.displayName}
        >
          <Avatar className="size-7">
            <AvatarImage src={user.avatarUrl} alt="" />
            <AvatarFallback>{user.displayName.slice(0, 1)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/progress">
            <TrendingUpIcon />
            My progress
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
