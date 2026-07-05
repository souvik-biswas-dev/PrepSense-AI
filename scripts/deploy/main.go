// Deploy tool for the PrepSense backend on the VPS.
//
// Pulls the latest commit into /opt/prepsense/repo (fast-forward only),
// rebuilds and restarts the api service, prunes this project's leftover
// build images, and verifies the API answers on its loopback port.
//
// Build for the VPS:
//
//	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o deploy .
package main

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"
)

const (
	stackDir  = "/opt/prepsense"
	repoDir   = "/opt/prepsense/repo"
	healthURL = "http://127.0.0.1:8091/"
)

func main() {
	before, err := output(repoDir, "git", "rev-parse", "--short", "HEAD")
	if err != nil {
		fail("reading current commit", err)
	}

	if err := run(repoDir, "git", "pull", "--ff-only"); err != nil {
		fail("git pull", err)
	}

	after, err := output(repoDir, "git", "rev-parse", "--short", "HEAD")
	if err != nil {
		fail("reading new commit", err)
	}
	fmt.Printf("repo: %s -> %s\n", before, after)

	if err := run(stackDir, "docker", "compose", "up", "-d", "--build", "api"); err != nil {
		fail("docker compose up", err)
	}

	// Only prunes untagged leftovers labeled with this compose project;
	// cannot touch other stacks on the host.
	_ = run(stackDir, "docker", "image", "prune", "-f",
		"--filter", "label=com.docker.compose.project=prepsense")

	if err := waitHealthy(5, 3*time.Second); err != nil {
		fail("health check", err)
	}

	fmt.Printf("health: OK\ndeploy OK (%s)\n", after)
}

// run executes a command in dir, streaming its output to the terminal.
func run(dir, name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// output executes a command in dir and returns its trimmed stdout.
func output(dir, name string, args ...string) (string, error) {
	cmd := exec.Command(name, args...)
	cmd.Dir = dir
	cmd.Stderr = os.Stderr
	out, err := cmd.Output()
	return strings.TrimSpace(string(out)), err
}

// waitHealthy polls the API until it answers 200, retrying `attempts`
// times with `delay` between tries.
func waitHealthy(attempts int, delay time.Duration) error {
	client := &http.Client{Timeout: 5 * time.Second}
	var lastErr error
	for i := 0; i < attempts; i++ {
		time.Sleep(delay)
		resp, err := client.Get(healthURL)
		if err != nil {
			lastErr = err
			continue
		}
		resp.Body.Close()
		if resp.StatusCode == http.StatusOK {
			return nil
		}
		lastErr = fmt.Errorf("API answered %d", resp.StatusCode)
	}
	return fmt.Errorf("API not healthy at %s after %d attempts: %w", healthURL, attempts, lastErr)
}

func fail(step string, err error) {
	fmt.Fprintf(os.Stderr, "deploy FAILED at %s: %v\n", step, err)
	os.Exit(1)
}
