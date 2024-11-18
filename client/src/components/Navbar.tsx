import { Button } from "./ui/button"
import { LogOut, Share2 } from 'lucide-react'

interface NavbarProps {
  onLogout: () => void
  onShare: () => void
}

export default function Navbar({ onLogout, onShare }: NavbarProps) {
  return (
    <nav className="bg-primary text-primary-foreground p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={onShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="secondary" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
}