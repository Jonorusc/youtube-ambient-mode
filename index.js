let video = null
const videoContainer = document.querySelector(".video-container")
let canvasGradient = document.createElement("canvas")
canvasGradient.classList.add("canvas-gradient")

document.getElementById("video-input").addEventListener("change", function (event) {
  const file = event.target.files[0]

  if (file) {
    const videoURL = URL.createObjectURL(file)
    video = document.createElement("video")

    video.autoplay = true
    video.controls = true
    video.src = videoURL
    video.addEventListener("loadedmetadata", function () {
      const videoTitle = document.querySelector(".video-footer .title")
      const videoTitleSkeleton = videoTitle.querySelector(".skeleton")
      videoTitleSkeleton.style.display = "none"
      videoTitle.classList.add("loaded")

      const title = document.createElement("span")
      title.textContent = file.name.length > 25 ? file.name.substring(0, 25) + "..." : file.name
      videoTitle.appendChild(title)

      const removeVideoBtn = videoTitle.querySelector(".remove")

      // set videoContainer size to video size
      const aspectRatio = this.videoWidth / this.videoHeight
      const containerWidth = videoContainer.offsetWidth
      const containerHeight = Math.min(555, containerWidth / aspectRatio)

      videoContainer.style.height = containerHeight + "px"

      const videoContainerSkeleton = videoContainer.querySelector(".skeleton")
      videoContainerSkeleton.style.display = "none"

      videoContainer.appendChild(this)
      // append canvas to video container
      canvasBackground()

      removeVideoBtn.style.display = "block"

      removeVideoBtn.addEventListener("click", () => {
        videoContainer.removeChild(this)
        videoContainer.style.height = "55.5rem"
        videoContainerSkeleton.style.display = "block"
        videoTitleSkeleton.style.display = "block"
        removeVideoBtn.style.display = "none"
        videoTitleSkeleton.style.display = "block"
        videoTitle.classList.remove("loaded")
        videoTitle.removeChild(title)
        canvasBackground(false)
      })

      this.addEventListener("ended", () => canvasBackground(false))
    })

    video.addEventListener("play", function () {
      // append canvas to video container
      canvasBackground()

      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d", { willReadFrequently: true })
      const interval = 900

      setInterval(function () {
        if (video.paused || video.ended) return

        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const colours = getDominantColours(imageData.data, canvas)
        updateBackground(true, colours)
      }, interval)
    })

    video.addEventListener("pause", function () {
      updateBackground(false)
    })
  }
})

function canvasBackground(action = true) {
  if (action && !videoContainer.querySelector(".canvas-gradient")) {
    videoContainer.appendChild(canvasGradient)
  } else if(!action && videoContainer.querySelector(".canvas-gradient")){
    videoContainer.removeChild(canvasGradient)
  }
}

function updateBackground(update, dominantColours = []) {
  const ctx = canvasGradient.getContext("2d")

  if (!update) return

  try {
    const sortedColours = dominantColours.sort((a, b) => {
      if (a.position === b.position) {
        return a.count > b.count ? -1 : 1
      }
      if (a.position === "left") return -1
      if (b.position === "left") return 1
      if (a.position === "top" && b.position === "right") return -1
      if (a.position === "right" && b.position === "top") return 1
      if (a.position === "top" && b.position === "bottom") return -1
      if (a.position === "bottom" && b.position === "top") return 1
      if (a.position === "right" && b.position === "bottom") return -1
      if (a.position === "bottom" && b.position === "right") return 1
      return 0
    })

    sortedColours.forEach((colour) => {
      let gradient

      switch (colour.position) {
        case "left":
          gradient = ctx.createLinearGradient(0, 0, canvasGradient.width, 0)
          break
        case "top":
          gradient = ctx.createLinearGradient(0, 0, 0, canvasGradient.height)
          break
        case "right":
          gradient = ctx.createLinearGradient(canvasGradient.width, 0, 0, 0)
          break
        case "bottom":
          gradient = ctx.createLinearGradient(0, canvasGradient.height, 0, 0)
          break
        default:
          throw new Error("Invalid position colour: " + colour.position)
      }

      gradient.addColorStop(0, colour.rgba)
      gradient.addColorStop(1, "transparent")

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvasGradient.width, canvasGradient.height)

      const boxShadow =
        colour.position === "left"
          ? "-15px 0px 30px " + colour.rgba
          : colour.position === "top"
          ? "0px -15px 30px " + colour.rgba
          : colour.position === "right"
          ? "15px 0px 30px " + colour.rgba
          : "0px 15px 30px " + colour.rgba

      canvasGradient.style.boxShadow = canvasGradient.style.boxShadow ? canvasGradient.style.boxShadow + "," + boxShadow : boxShadow
    })
  } catch (error) {
    throw new Error("An error occurred while trying to create the gradient colours: " + error)
  }
}

function getDominantColours(imageData, canvas, opacity = 0.15) {
  let colourCounts = {}
  let colours = []
  const pixels = imageData.length / 4
  const videoWidth = canvas.width
  const videoHeight = canvas.height

  try {
    for (let i = 0; i < pixels; i++) {
      const r = imageData[i * 4]
      const g = imageData[i * 4 + 1]
      const b = imageData[i * 4 + 2]
      const rgba = r + "," + g + "," + b + "," + opacity

      if (colourCounts[rgba]) {
        colourCounts[rgba].count += 1
      } else {
        colourCounts[rgba] = {
          count: 1,
          position: null,
        }
      }

      const row = Math.floor(i / videoWidth)
      const col = i % videoWidth

      const distanceToTop = row
      const distanceToBottom = videoHeight - row - 1
      const distanceToLeft = col
      const distanceToRight = videoWidth - col - 1

      if (distanceToTop <= distanceToBottom && distanceToTop <= distanceToLeft && distanceToTop <= distanceToRight) {
        colourCounts[rgba].position = "top"
      } else if (distanceToBottom <= distanceToTop && distanceToBottom <= distanceToLeft && distanceToBottom <= distanceToRight) {
        colourCounts[rgba].position = "bottom"
      } else if (distanceToLeft <= distanceToTop && distanceToLeft <= distanceToBottom && distanceToLeft <= distanceToRight) {
        colourCounts[rgba].position = "left"
      } else {
        colourCounts[rgba].position = "right"
      }
    }

    for (let colour in colourCounts) {
      colours.push({
        rgba: `rgba(${colour})`,
        count: colourCounts[colour].count,
        position: colourCounts[colour].position,
      })
    }

    colours.sort(function (a, b) {
      return b.count - a.count
    })
  } catch (error) {
    throw new Error("An error occurred while trying to select dominant colours: " + error)
  }

  // returning the top 3 colours
  return colours.slice(0, 3)
}
