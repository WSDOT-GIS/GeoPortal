import sys, os, subprocess

# Get the directory that Inkscape is in.
inkscape = os.path.join(os.path.join(os.environ["programfiles"], "Inkscape"), "Inkscape.exe")

# Exit the program if Inkscape cannot be found.
if not os.path.exists(inkscape):
    exit("Inkscape executable file not found.")

size = 25
if len(sys.argv) > 1:
    try:
        size = int(sys.argv[1])
    except:
        print "Invalid size parameter provided."


# Get the full path to the current directory
svgFiles = [
    "Construction1",
    "Construction2",
    "Construction3",
    "Construction4",
	"Construction5",
    "Flagger1",
    "Flagger2",
    "Flagger3",
    "Flagger4",
	"Flagger5",
    "AccidentAlert1",
    "AccidentAlert2",
    "AccidentAlert3",
    "AccidentAlert4",
	"AccidentAlert5",
    "RoadClosure",
    "Weather1",
    "Weather2",
    "Weather3",
    "Weather4",
	"Weather5",
    "Alt/Construction1",
    "Alt/Construction2",
    "Alt/Construction3",
    "Alt/Construction4"
]

for fn in svgFiles:
    svgFile = os.path.abspath("%s.svg" % fn)
    pngFile = os.path.abspath("%s.png" % fn)
    if not os.path.exists(svgFile):
        # Print an error message if the SVG file was not found.
        print '"%s" was not found." % svgFile'
    elif os.path.exists(pngFile):
        print 'Output file "%s" already exists.  Skipping to next SVG file...' % pngFile
    else:
        returncode = subprocess.call([inkscape, svgFile, "--export-png=%s" % pngFile, "-w%s" % size, "-h%s" % size, "--export-area-drawing"])
        print "Return code: %s" % returncode
