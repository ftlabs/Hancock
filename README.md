# Hancock
A module that determines similarity between two handwritten signatures using the Pearson product-moment correlation coefficient

## What does this do?
This module uses the [Pearson product-moment correlation coefficient](https://en.wikipedia.org/wiki/Pearson_product-moment_correlation_coefficient) to determine how similar two handwritten signatures are to one another

## Why would you do this?

Identifying an individuals signature across a multitude of organisations and documents is tough. Hancock doesn't attempt to determine to whom each signature belongs, it only gives a value (between 0 and 1) which 

## How does it work?
Hancock doesn't compare each image pixel-for-pixel. It generates a profile of each signature by counting adding up the number of black pixels along a Y-axis for each position along the X-axis of an image. These values are then used to plot a curve which is can be compared to other curves (generated in the same manner) with the Pearson correlation coefficient.

### The normalisation process
Before a profile is generated for comparison, each image is first normalised to remove erroneous data.

1. First, the image is converted to greyscale.
2. The value of each pixel in the image is then checked to see if it's higher or lower than a given threshold
    * If the pixel value is less than the threshold value, it's set to 0 (black)
    * If the pixel value is greater than the threshold value, it's set to 255 (white)
3. The bounds of the handwritten signature are then detected.
4. The image is then cropped to the bounds of the handwritten signature, removing all erroneous data and leaving us only with the handwritten data.
5. The image is then stretched to fill a 500 x 500 pixel box.

### The profile generation process
Each image to be compared has a profile generated. These profiles are the items that are compared, not the images themselves.

1. First, we create an array (the `counts` array) with the size of the image width. Each index in this array corresponds to the X-axis of the image we're generating a profile for (it's a one-dimensional array).
2. The pixel data for each image is looped over. For every pixel value that is 0, we add a count of 1 to the index of the `counts` array which represents the X value of the pixel that we're checking.

*(we also determine the locations and sizes of peaks in the counts data, which could be used for further analysis, but this information isn't currently used by Hancock at this time)*

### The comparison process
At this point, we now have two (or more) one-dimensional arrays containing the number of black pixels in a y-axis along the x-axis for each image. We don't do a straight comparison between the datasets to return a value. Instead, we break each curve up into 10 equal sections and apply [dynamic time warping](https://en.wikipedia.org/wiki/Dynamic_time_warping) to each section to try and find the best correlation between each sections closest neighbor. The closest correlation for each section is added to the closest correlation for every other section and the average of those correlations are returned.

1. The `counts` array from the profile process is broken up into 10 equal sections
2. Each section of the image we're comparing is then compared with the same section from the image it's being compared with.
3. The same section is then compared against the second image data, but offset by one value, then by another, and another until the section has been shifted by the width of a section. The best correlation value is the value retained for this sections.
4. This process is repeated for every other section in the `counts` array.
5. After each section has been compared, the mean average of all of the best correlation values (closest to 1) is calculated and returned. This value represents how similar one signature is to the other.



