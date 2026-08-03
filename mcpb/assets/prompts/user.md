# Streamfog MCP — User Guide and Tutorials

This guide walks through everything you need to know to use Streamfog MCP
effectively, from a first-time installation to advanced production workflows
for live streaming with AR lenses, face filters, and Vtuber avatars. The
examples are written in natural language so you can follow along with your
favorite AI assistant or use the MCP tools directly.

## Chapter 1 — What You Are Setting Up

Streamfog MCP connects three pieces of software on one computer: the
Streamfog desktop application, which renders AR lenses and face filters on
top of your camera feed; Streamer.bot, a free automation tool for streamers
that can trigger actions through a local WebSocket server; and this MCP
server, which translates AI assistant commands into Streamer.bot actions.

The chain looks like this: you talk to your AI assistant, the assistant
calls a Streamfog MCP tool, the tool sends a WebSocket message to
Streamer.bot, Streamer.bot fires an action, and Streamfog applies the visual
change. OBS Studio then shows the result through a browser source. Every
step is local; nothing goes to the cloud, and the latency is effectively
instant.

## Chapter 2 — First-Time Installation

Step one is to install Streamfog from the official website. Run the
installer and launch the application at least once so it can configure its
camera access. Step two is to install Streamer.bot, also from its official
site. Launch it once so it creates its configuration folders. Step three is
to enable the Streamfog integration inside Streamer.bot: open Streamer.bot,
navigate to the Streamfog integration panel, and click enable. Step four is
to enable the WebSocket server: in Streamer.bot settings, find the WebSocket
Server section, enable it, and note the port, which defaults to 8080. Step
five is to install this MCP server by cloning the repository and running the
dependency installer. Step six is to create the lens mapping file, which
tells the server which Streamer.bot actions correspond to which lenses. Step
seven is to start the server with the launcher script, which opens both the
backend and the dashboard.

## Chapter 3 — Creating Your First Lens Mapping

The lens mapping file is a simple JSON document. Each entry has a
human-readable key on the left and a Streamer.bot action name on the right.
A minimal file looks like this:

{
  "beauty_smooth": "SetLens_BeautySmooth",
  "cyber_helmet": "SetLens_CyberHelmet",
  "vtuber": "SetLens_VTuberAvatar"
}

Save this as lenses.json in the server root directory. Restart the server
or use the reload endpoint so the map is loaded. You can verify the mapping
by calling the list lenses tool, which returns every configured identifier
together with its action name. The naming convention matters: the action
names must exist in Streamer.bot exactly as written, because Streamer.bot
matches action names literally. If an action is named SetLens_BeautySmooth
and your mapping says SetLens_beautysmooth, the action will be dispatched
but nothing will happen.

Keys that begin with an underscore are ignored by the server, which is a
convenient way to keep comments inside the file. For example you can add
"_note": "these are my VTuber lenses" and the server will skip it while
humans can still read it.

## Chapter 4 — Controlling Lenses During a Stream

Once the mapping exists and the server is running, you control lenses by
referring to the human-readable identifiers. To activate the beauty
smoothing lens, tell your assistant to switch to the beauty_smooth lens, or
call the set lens tool directly with the identifier. The server resolves
the identifier through the mapping and dispatches the corresponding action.

A useful habit is to ask for the current status first. The status tool
tells you whether the Streamer.bot bridge is connected, how many lenses are
loaded, and whether the last operation left an error behind. If the bridge
is not connected, every lens command will fail with the same underlying
reason, so checking once at the start of a session saves you from repeating
mistakes.

The server has a useful fallback for unknown identifiers: if you call the
set lens tool with an identifier that is not in the mapping, it constructs
an action name by prefixing the identifier with SetLens_. This means you can
attempt any lens by its natural name even before adding it to the mapping.
If the action exists in Streamer.bot under that name, it will work.

## Chapter 5 — Clearing Effects and Resetting

Live streams can get messy. Effects accumulate, an avatar glitches, or a
viewer triggers something unexpected. The clear effects tool dispatches the
ClearEffects action, which strips every AR asset and overlay and returns the
camera to a clean baseline. This is the fastest recovery path and works even
if you are not sure which effects are currently active, because it clears
everything.

There is no undo. If you clear effects and then realize you wanted to keep
one overlay, you must re-apply it explicitly. Keep this in mind during
segments where you have carefully layered multiple effects.

## Chapter 6 — Working with the Vtuber Avatar

The toggle avatar tool switches your Vtuber-style avatar overlay on or off.
It is a toggle, which means the same call flips whatever state is currently
active. If you do not know whether the avatar is currently visible, the
server cannot tell you, because Streamer.bot does not report state back. The
honest approach is to toggle once and ask the streamer to confirm visually.

During a typical roleplay segment you might use the avatar for the opening,
clear effects when transitioning to a discussion segment, and toggle the
avatar off before an interview. These three tools cover the entire visual
lifecycle.

## Chapter 7 — Editing the Mapping While Streaming

Suppose you want to add a new lens mid-stream without restarting anything.
First create the action in Streamer.bot with the exact name you want. Next,
edit the lenses.json file to add the mapping entry. Finally, tell the server
to reload the map by calling the list lenses tool with the reload flag set
to true, or by using the reload button on the dashboard. The server re-reads
the file from disk and the new identifier becomes available immediately.

The reload is atomic in effect: the file is parsed in full, and a broken
JSON file leaves the previous map untouched while logging an error. This
means you can safely edit the file while the server is running.

## Chapter 8 — Troubleshooting a Broken Connection

The single most common problem is the Streamer.bot connection. The symptoms
are consistent: every lens command returns a failure with a message about
not being connected, and the status tool reports the bridge as disconnected
with a last error field that contains the reason.

If the error mentions connection refused, Streamer.bot is either not running
or listening on a different port. Open Streamer.bot, check the WebSocket
Server setting, and compare it with the configured streamerbot port in your
environment. The default is 8080 on both sides.

If the error mentions authentication, the token is wrong or present on only
one side. Either disable token authentication in Streamer.bot entirely, or
set the server token to match exactly. Tokens are case-sensitive.

If the error mentions something about the WebSocket protocol or an invalid
request, the most likely cause is an outdated Streamer.bot version or a
misconfigured integration. Update both applications and re-enable the
integration.

## Chapter 9 — Understanding Fire-and-Forget

A fundamental concept of this integration is that Streamer.bot does not
tell anyone whether an action succeeded. The server sends the action name
over the socket and considers the operation complete. This has practical
consequences: the tools always report that an action was dispatched, never
that a lens was applied.

When you are operating the server through an assistant, keep this in mind
when the assistant claims a lens is active. The accurate statement is that
the action was sent. If the visual state matters, confirm on the stream or
ask the streamer.

This design is a limitation of the Streamer.bot protocol, not a bug in the
server. There is no way to query Streamer.bot for action outcomes, and
Streamfog exposes no query API, so the information simply does not exist.

## Chapter 10 — Using the Dashboard

The web dashboard is a visual companion to the MCP tools. It shows the
backend health, the Streamer.bot bridge state, the loaded lens count, and
the uptime. The lens grid lets you activate any configured lens with one
click. Quick action buttons clear all effects and toggle the avatar. The
reload button refreshes the lens map from disk. The dashboard polls the
backend with exponential backoff, so it recovers automatically when the
server restarts.

The dashboard also hosts the tools page, which lists every MCP tool with
its description and input schema, fetched live from the server; the settings
page, which shows backend health and detects local LLM providers for chat;
the chat page, which lets you talk to a local LLM with the skill as its
system prompt; the help page, which contains this documentation; and a logs
modal, opened with the terminal icon or by pressing Ctrl and L, which shows
the live server log stream.

## Chapter 11 — Using the Chat with a Local LLM

The chat page is powered by a local LLM. On load it probes your machine for
Ollama, LM Studio, and vLLM. If one is detected, you can select the provider
and model, and chat with a system prompt built from the Streamfog skill plus
a personality role. The conversation is stored in your browser and can be
exported as a text file.

If no local LLM is detected, the chat explains how to install Ollama and
gives a GPU hint when a capable graphics card is present. The model and
provider selections persist between sessions.

## Chapter 12 — Common Workflows

Interview workflow: verify the bridge with a status call, clear all effects
for a clean baseline, and leave the avatar off. This gives the interviewer a
clean camera.

Gaming workflow: activate a subtle lens like beauty smoothing, keep effects
minimal to preserve performance, and clear everything before a serious
competitive segment.

VTuber workflow: toggle the avatar on for the stream opening, use the lens
switcher for scene changes, and toggle the avatar off during breaks.

Recovery workflow: when anything looks wrong, clear effects first, then
check status, then re-apply the intended lens. This order minimizes the time
spent in a broken visual state.

## Chapter 13 — Advanced Tips

Use consistent identifier naming. The mapping keys become the vocabulary of
your whole integration, so name them with the same scheme you will use in
conversation. snake_case with descriptive names works well.

Keep the mapping file small. A stream typically uses five to ten lenses;
more than that becomes hard to navigate and most lenses will never be used.
Remove unused entries to keep the tool responses compact.

Create a second mapping for special events. You can point the server at a
different mapping file by changing the lens map path environment variable
and restarting. A holiday event mapping can be swapped in and out without
touching your daily mapping.

Use the reload tool after every mapping edit instead of restarting the
server. It is faster, keeps the bridge connection alive, and avoids a
connection hiccup in the middle of a broadcast.

When something does not work, read the last error field of the status tool
before changing configuration. It almost always names the failing layer:
Streamer.bot not running, wrong port, wrong token, or an invalid action
name.

## Chapter 14 — Frequently Asked Questions

Do I need OBS? No, the server works without OBS, but OBS is where most
streamers see the result. Streamfog renders its own preview window.

Does this work with Twitch? Streamer.bot works with Twitch, YouTube, and
many other platforms. The server does not care about the platform; it only
dispatches actions.

Can I use this without an AI assistant? Yes, the dashboard gives you the
same controls with buttons, and the REST API is scriptable.

Is there a cost? Streamfog is a commercial product, but the MCP server,
Streamer.bot, and the dashboard are free to use locally.

Can I run this on a second computer? The server expects Streamer.bot on the
same machine, because the WebSocket connection is local. If you want to
control a streaming PC from another machine, run the server on the streaming
PC and connect your MCP client over the network with proper security
considerations.

What happens if the power goes out mid-stream? The server holds no state
that matters; after a restart it reloads the mapping and reconnects to
Streamer.bot on the next action. Your stream configuration lives in
Streamer.bot and Streamfog, not in this server.

How do I update the server? Pull the latest code and reinstall dependencies.
The mapping file and environment configuration are preserved because they
live outside the code.

Where do logs go? The dashboard logs modal shows a live window of the last
500 records. Console output goes to the terminal running the server, and
the desktop wrapper writes a backend-spawn log in the app log directory.

## Chapter 15 — Getting Help

The help page of the dashboard contains the architecture diagram, the full
prerequisite checklist, the environment variable reference, a
troubleshooting table, and links to the documentation files. If a tool
returns a failure you do not understand, the status tool's last error field
is the first place to look. If the dashboard shows the backend offline,
start the server and wait for the automatic reconnection.

The project repository contains the README with quick start instructions,
the installation guide, the full tool reference, and this document. Issues
are tracked in the repository, and the fleet documentation hub holds the
development guide and configuration reference.

## Chapter 16 — The Mental Model in One Paragraph

Think of this server as a remote control for a camera effects processor. The
remote control has five buttons: check connection, set lens, clear all,
toggle avatar, and list lenses. Every button sends a command over a local
wire to the processor, which is Streamer.bot, and Streamer.bot tells the
camera application, which is Streamfog, what to do. The remote control
cannot see the camera image, so it never knows whether the command was
applied; it only knows whether the command was sent. Keep that model in
mind, use the status button before anything else, and the whole system is
predictable.

## Chapter 17 — Step-by-Step Installation Walkthrough

This chapter expands the installation into a complete walkthrough with
verification at every stage. It assumes a Windows machine with an internet
connection and a webcam.

Stage one: install Streamfog. Download the installer from the Streamfog
website and run it. When the application opens for the first time, it asks
for camera permission; grant it and confirm that you can see your face in
the preview. Close Streamfog for now; it does not need to run during setup.

Stage two: install Streamer.bot. Download the installer and run it. The
first launch creates folders for actions, integrations, and settings.
Open the Settings dialog and find the WebSocket Server section. Enable it.
The default port is 8080; note it. If you enable token authentication, copy
the generated token somewhere safe; you will need it in the server
configuration.

Stage three: enable the Streamfog integration. In Streamer.bot, look for
the Integrations panel. Streamfog should appear as an available
integration. Click enable. This is what allows Streamer.bot to forward
actions to Streamfog.

Stage four: create test actions. In Streamer.bot, open the Actions panel
and create an action named SetLens_BeautySmooth. Add a sub-action that
tells Streamfog to apply the beauty smooth lens; the exact sub-action
depends on the installed Streamfog integration version, but the integration
usually exposes a set-lens command. Create similar actions for
SetLens_CyberHelmet, ClearEffects, and ToggleAvatar. If you are unsure
about the exact sub-action, check the Streamfog integration documentation
or use the integration's built-in templates.

Stage five: install the MCP server. Clone the repository to your machine.
Open a terminal in the repository root and run the dependency installer
command, which creates a virtual environment and installs all packages.
Verify the installation by running the test suite; all tests should pass.

Stage six: create the mapping file. In the repository root, create
lenses.json with the test action names from stage four. Save the file.

Stage seven: start the server. Run the launcher script. It clears the
ports, starts the backend, waits for it to be ready, starts the dashboard,
and opens your browser. You should see the dashboard with the bridge status
indicator. At this point the bridge is probably still disconnected because
Streamer.bot is closed.

Stage eight: start Streamer.bot and Streamfog. Launch both applications.
Return to the dashboard and watch the bridge indicator. Within a few
seconds it should turn green and show the lens count. If it stays red, use
the status tool or check the last error, then re-check the port and token
configuration.

Stage nine: test a lens. Click a lens on the dashboard grid or call the set
lens tool. Look at the Streamfog preview window. The lens should apply
within a second. Click the clear button; the effects should vanish.

## Chapter 18 — Detailed Troubleshooting Scenarios

Scenario A: the dashboard shows the backend offline. The server process is
not running, or it failed to start because the port was occupied. Check
whether anything else listens on port 10994. Close the conflicting
application and restart the server. The dashboard retries automatically, so
no browser refresh is needed after the server comes back.

Scenario B: the dashboard shows the backend online but the bridge
disconnected. Streamer.bot is not running, or its WebSocket server is
disabled, or the port is wrong. Open Streamer.bot and verify the WebSocket
Server setting. Compare it with the streamerbot port configured for the
server. Restart Streamer.bot if the setting was changed.

Scenario C: the bridge is connected but a lens command fails. The most
common cause is an action name mismatch. The server dispatches the exact
string from the mapping; Streamer.bot requires the exact name. Check for
typos, capitalization differences, and extra spaces. Correct the mapping
and reload.

Scenario D: the bridge is connected, the action exists, but nothing happens
visually. Streamfog may not be running, or its integration may be disabled,
or the wrong camera is selected. Open Streamfog, verify the integration in
Streamer.bot, and verify the preview shows the camera.

Scenario E: authentication errors. The token is configured on exactly one
side. Either set the token on both sides to the same value, or disable
token authentication on both sides.

Scenario F: everything works in the dashboard but the AI assistant cannot
reach the server. The assistant connects over stdio or over the HTTP
endpoint. If using stdio, the client configuration must point at the
correct command. If using HTTP, the assistant must be pointed at the MCP
endpoint URL. Verify the client configuration, then test with the status
tool.

Scenario G: the server crashes on startup. Read the console output. The
most common causes are a missing dependency or a corrupted environment.
Reinstall the environment from scratch and run the test suite before
starting the server again.

## Chapter 19 — REST API Usage Examples

The REST API is the scriptable interface to the same functionality as the
MCP tools. Every endpoint returns JSON.

To check health with a command-line tool, request the health endpoint. The
response contains the status, the version, the uptime in seconds, the tool
count, and the bridge state.

To list lenses, request the lenses endpoint. The response contains the full
mapping object, the count, and the mapping path.

To activate a lens, send a POST request to the lenses set endpoint with a
JSON body containing the lens identifier. The response mirrors the MCP tool
response with success, message, and data fields.

To clear effects, POST to the effects clear endpoint. To toggle the avatar,
POST to the avatar toggle endpoint. To reload the mapping, POST to the
lenses reload endpoint.

To list tools dynamically, GET the tools endpoint; the response contains
every registered tool with its description and input schema. This is what
the dashboard tools page renders.

To read diagnostics, GET the diagnostics endpoint; the response contains
the tool list, platform information, bridge state, and recent error records.

These endpoints are convenient for scripts, monitoring, and integration
tests. They share the same bridge and state as the MCP tools, so a lens
activated over REST is visible to the MCP client and vice versa.

## Chapter 20 — MCP Client Setup Examples

Claude Desktop: open the Claude Desktop configuration file and add a server
entry for Streamfog MCP. The entry names a command and an argument; the
command is the MCP server executable provided by the package, or the Python
module entry point. Restart Claude Desktop and the tools become available.

Cursor: open the Cursor MCP settings and add a server entry with the same
command. Cursor connects over stdio and lists the five tools under the MCP
tool panel. Test with a simple prompt such as listing the configured lenses.

opencode: add a stdio entry to the opencode configuration referencing the
server command. The tools appear in the session tool list and can be called
directly.

Streamable HTTP: when the server runs in dual mode, any MCP client that
supports HTTP transport can connect to the MCP endpoint URL. The endpoint
implements the standard streamable HTTP protocol with session management.

## Chapter 21 — Planning a Live Show with This Server

A practical live show plan shows how the tools compose into a production
workflow. Pre-show: verify the bridge with a status call, list the lenses
to confirm the mapping, and clear all effects for a clean start. Opening:
toggle the avatar on and activate a signature lens. Content segments: switch
lenses to match each segment's theme. Breaks: clear effects and toggle the
avatar off so the camera is plain. Guest segments: clear effects, keep the
avatar off, and use only subtle lenses. Finale: activate the signature lens,
toggle the avatar back on, and hold the visual through the outro. Post-show:
clear everything and leave the system ready for the next broadcast.

A failsafe rule: whenever anything looks wrong on stream, the first command
is always clear effects. It is the one command that resets the visual state
regardless of what caused the problem, and it costs nothing to run.

## Chapter 22 — Writing Your Own Integrations

Because the REST API is plain JSON over HTTP, you can build your own
integrations on top of it. A chat bot for your viewers could trigger lens
switches through the REST endpoints. A moderation script could clear
effects when a keyword is detected. A scene script in OBS could reload the
mapping after a configuration change. All integrations share the same
bridge, so they coexist with the MCP tools and the dashboard without
conflict.

When building integrations, respect the fire-and-forget semantics: your
script cannot know whether a lens applied, only that the action was
dispatched. Log the dispatch and rely on the status endpoint for
diagnostics. Rate-limit your calls during live broadcasts to avoid visual
flicker from rapid switches.

## Chapter 23 — Complete Configuration Reference

Every setting the server understands, with its environment variable name,
default value, and a description of what it controls.

The first setting is the Streamer.bot host. The default value is the
loopback address. It should stay the loopback address in normal use because
Streamer.bot runs on the same machine as the server. Change it only when
you deliberately connect to a Streamer.bot instance on another machine,
which requires opening the WebSocket port on that machine.

The second setting is the Streamer.bot port. The default is 8080. This
port is configured in Streamer.bot itself under the WebSocket Server
settings; the two values must match. If you change the port in Streamer.bot,
change it here as well, and restart the server.

The third setting is the Streamer.bot authentication token. It has no
default value; an empty token means no authentication. When Streamer.bot
has token authentication enabled, this value must match the token shown in
Streamer.bot exactly, including capitalization. Tokens are sent over the
local WebSocket and are not logged by the server.

The fourth setting is the lens map path. The default is the lenses.json
file in the server working directory. The path may be absolute or relative;
relative paths resolve against the directory the server was started from.
The file must be a JSON object mapping string keys to string values.

The fifth setting is the server port. The default is 10994. This is the
port of the FastAPI gateway and the MCP HTTP endpoint when the server runs
in dual mode. The dashboard and the launcher script rely on this value, and
the fleet port registry assigns this exact port to this project.

The sixth setting is the bind host. The default is the loopback address.
Keep it on loopback for local use; bind to all interfaces only when you
have a specific reason and understand the exposure.

The seventh setting is the log level. The default is INFO. Set it to DEBUG
for detailed diagnostics, or to WARNING for quieter operation.

All settings share the environment variable prefix, and every variable can
also be placed in a dot-env file at the repository root. Values in the
environment take precedence over values in the dot-env file.

## Chapter 24 — Glossary

AR lens: an augmented reality effect applied to the camera feed, such as a
virtual helmet or a beauty filter.

Action: a named command in Streamer.bot that performs one or more
sub-actions. The server dispatches actions by name.

Bridge: the WebSocket connection between this server and Streamer.bot.

Browser source: an OBS source that renders a web page, used to show the
Streamfog output on the stream.

Dual mode: the server configuration where the FastAPI gateway, the REST
API, and the MCP HTTP endpoint are served by one process.

Fire-and-forget: a dispatch model where the sender does not wait for or
receive an outcome; Streamer.bot actions work this way.

Integration: the connection between Streamer.bot and Streamfog enabled in
the Streamer.bot integrations panel.

Lens map: the JSON file that maps human-readable identifiers to Streamer.bot
action names.

MCP: the Model Context Protocol, the standard this server uses to expose
tools to AI assistants.

Ring buffer: a bounded in-memory log store that keeps the most recent
records; the server keeps the last five hundred.

Stdio mode: the server configuration where MCP communication happens over
standard input and output, used by desktop clients.

Streamable HTTP: the MCP transport over HTTP with session management, used
by clients that connect over the network.

Uptime: the number of seconds the server process has been running,
reported by the health and diagnostics endpoints.

## Chapter 25 — Final Checklist Before Your First Live Use

Confirm that Streamfog is installed and shows your camera preview. Confirm
that Streamer.bot is installed with the WebSocket server enabled and the
Streamfog integration enabled. Confirm that the action names in your
mapping file exist exactly in Streamer.bot. Confirm that the configured
port matches the Streamer.bot WebSocket port, and that the token matches
when authentication is enabled. Confirm that the server starts without
errors and the test suite passes. Confirm that the dashboard shows the
bridge connected and the expected lens count. Confirm that a test lens
switch works and that clear effects restores the baseline. Once all eight
checks pass, you are ready to use the system live.


