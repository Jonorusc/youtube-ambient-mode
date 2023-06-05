const videoContainer = document.querySelector(".video-container")

// code for the video input
document.getElementById("video-input").addEventListener("change", function (event) {
  // this = input
  const file = event.target.files[0]

  if (file) {
    const videoURL = URL.createObjectURL(file)
    video = document.createElement("video")

    video.autoplay = true
    video.controls = true
    video.src = videoURL
    video.addEventListener("loadedmetadata", function () {
      // this = video
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

      // remove video btn
      removeVideoBtn.style.display = "block"

      removeVideoBtn.addEventListener("click", () => {
        // this = video
        videoContainer.removeChild(this)
        videoContainer.style.height = "55.5rem" // 555px
        videoContainerSkeleton.style.display = "block"
        videoTitleSkeleton.style.display = "block"
        removeVideoBtn.style.display = "none"
        videoTitleSkeleton.style.display = "block"
        videoTitle.classList.remove("loaded")
        videoTitle.removeChild(title)
      })

      // get the colours from the video
      getVideoColours(this)

      // when video ends
      this.addEventListener("ended", () => {
        videoContainer.style.backgroundImage = "none" // reset the background
        videoContainer.style.boxShadow = "none" // reset the box shadow
      })
    })
  }
})

function getVideoColours(video) {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d", { willReadFrequently: true })
  const interval = 1500 // second

  video.addEventListener("play", function () {
    setInterval(function () {
      if (video.paused || video.ended) return

      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const colours = getDominantColours(imageData.data)
      updateBackground(colours)
    }, interval)
  })
}

function updateBackground(dominantColors) {
  if (dominantColors.length > 0) {
    // const gradientAngle = Math.floor(Math.random() * 361)
    // const linearGradient = `linear-gradient(${gradientAngle}deg, rgb(${dominantColors[0].rgb}) 70%, rgb(${dominantColors[1].rgb}) 20%, rgb(${dominantColors[2].rgb}) 100%)`

    const radialGradient = `
    radial-gradient(ellipse at top, rgba(${dominantColors[0].rgb}, 0.44), transparent), 
    radial-gradient(ellipse at bottom, rgba(${dominantColors[2].rgb}, 0.44), transparent), 
    radial-gradient(ellipse at right, rgba(${dominantColors[1].rgb}, 0.44), transparent)`

    videoContainer.style.backgroundImage = radialGradient

    const boxShadow = `
    -16px -30px 50px -50px rgba(${dominantColors[0].rgb},0.44), 
    16px 30px 50px 25px rgba(${dominantColors[2].rgb},0.44), 
    0px 0px 50px 50px rgba(${dominantColors[1].rgb},0.34)`

    videoContainer.style.boxShadow = boxShadow
  }
}

function getDominantColours(imageData) {
  let colourCounts = {}
  const pixels = imageData.length / 4

  for (let i = 0; i < pixels; i++) {
    const r = imageData[i * 4]
    const g = imageData[i * 4 + 1]
    const b = imageData[i * 4 + 2]
    const rgb = r + "," + g + "," + b

    if (colourCounts[rgb]) {
      colourCounts[rgb] += 1
    } else {
      colourCounts[rgb] = 1
    }
  }

  let colours = []
  for (let colour in colourCounts) {
    colours.push({
      rgb: colour,
      count: colourCounts[colour],
    })
  }

  colours.sort((a, b) => {
    return b.count - a.count
  })

  return colours.slice(0, 3)
}
