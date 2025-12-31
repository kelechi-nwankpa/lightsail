import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, GitBranch, Cloud, FileCheck } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold">Lightsail</span>
          </div>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Get Started</Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Button onClick={() => navigate('/dashboard')}>Dashboard</Button>
            </SignedIn>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Compliance Made{' '}
            <span className="text-primary-600">Simple</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Achieve SOC 2 and ISO 27001 compliance in weeks, not months.
            Automate evidence collection, manage policies, and stay audit-ready.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg">Start Free Trial</Button>
              </SignUpButton>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </SignedOut>
            <SignedIn>
              <Button size="lg" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </SignedIn>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-24 max-w-5xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary-600" />
                <CardTitle className="mt-4">SOC 2 & ISO 27001</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Pre-built control libraries mapped to major compliance frameworks.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Cloud className="h-10 w-10 text-primary-600" />
                <CardTitle className="mt-4">AWS Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automatically collect evidence from your AWS infrastructure.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <GitBranch className="h-10 w-10 text-primary-600" />
                <CardTitle className="mt-4">GitHub Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Monitor branch protection, code review, and security settings.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileCheck className="h-10 w-10 text-primary-600" />
                <CardTitle className="mt-4">Policy Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AI-assisted policy generation with version control and approvals.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Lightsail. All rights reserved.</p>
      </footer>
    </div>
  );
}
