let video = null
const videoContainer = document.querySelector(".video-container")

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

      const aspectRatio = this.videoWidth / this.videoHeight
      const containerWidth = videoContainer.offsetWidth
      const containerHeight = Math.min(555, containerWidth / aspectRatio)

      videoContainer.style.height = containerHeight + "px"

      const videoContainerSkeleton = videoContainer.querySelector(".skeleton")
      videoContainerSkeleton.style.display = "none"

      videoContainer.appendChild(this)

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
      })

      getVideoColours(this)

      this.addEventListener("ended", () => {
        videoContainer.style.backgroundImage = "none"
        videoContainer.style.boxShadow = "none"
      })
    })
  }
})

function getVideoColours(video) {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d", { willReadFrequently: true })
  const interval = 1500

  video.addEventListener("play", function () {
    setInterval(function () {
      if (video.paused || video.ended) return

      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const colours = getDominantColours(imageData.data, canvas)
      updateBackground(colours)
    }, interval)
  })
}

function updateBackground(dominantColours) {
  if (dominantColours.length > 0) {
    const radialGradient = `
    radial-gradient(ellipse at ${dominantColours[0].position}, rgba(${dominantColours[0].rgb}, 0.45) 70%, rgba(${dominantColours[1].rgb}, 0.07)), 
    radial-gradient(ellipse at ${dominantColours[2].position}, rgba(${dominantColours[2].rgb}, 0.45) 70%, rgba(${dominantColours[1].rgb}, 0.07)), 
    radial-gradient(ellipse at ${dominantColours[1].position}, rgba(${dominantColours[1].rgb}, 0.45) 70%, rgba(${dominantColours[1].rgb}, 0.07))`

    videoContainer.style.background = radialGradient

    const topOrBottom = (index) => (
      dominantColours[index].position === "top" ? "-39px" : dominantColours[index].position === "bottom" ? "39px" : "0"
    )

    const boxShadow = `
    -4px ${topOrBottom(0)} 50px 20px rgba(${dominantColours[0].rgb},0.35), 
    -4px ${topOrBottom(2)} 50px 20px rgba(${dominantColours[2].rgb},0.35), 
    -32px 0px 50px 20px rgba(${dominantColours[1].rgb},0.35)`

    videoContainer.style.boxShadow = boxShadow
  }
}

function getDominantColours(imageData, canvas) {
  let colourCounts = {}
  const pixels = imageData.length / 4
  const videoWidth = canvas.width 
  const videoHeight = canvas.height 

  for (let i = 0; i < pixels; i++) {
    const r = imageData[i * 4]
    const g = imageData[i * 4 + 1]
    const b = imageData[i * 4 + 2]
    const rgb = r + "," + g + "," + b

    if (colourCounts[rgb]) {
      colourCounts[rgb].count += 1
    } else {
      colourCounts[rgb] = {
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
      colourCounts[rgb].position = "top"
    } else if (distanceToBottom <= distanceToTop && distanceToBottom <= distanceToLeft && distanceToBottom <= distanceToRight) {
      colourCounts[rgb].position = "bottom"
    } else if (distanceToLeft <= distanceToTop && distanceToLeft <= distanceToBottom && distanceToLeft <= distanceToRight) {
      colourCounts[rgb].position = "left"
    } else {
      colourCounts[rgb].position = "right"
    }
  }

  let colours = []
  for (let colour in colourCounts) {
    colours.push({
      rgb: colour,
      count: colourCounts[colour].count,
      position: colourCounts[colour].position,
    })
  }

  colours.sort(function (a, b) {
    return b.count - a.count
  })

  return colours.slice(0, 3)
}
