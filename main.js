const MENU_ID = "webp2legacy";

function registerContextMenu() {
	console.log('registering context menu');
	browser.menus.create({
		id: MENU_ID,
		title: "Copy as PNG",
		contexts: ["image"],
		icons: {
			// TODO: use a different icon here for dark vs light mode
			"32": "res/png-icon-light.svg",
		},
	});
}

/**
 * According to the docs, we should only need register context menus
 * in browser.runtime.onInstalled. However, disabling and re-enabling
 * the extension does not run this callback, and there seem to be other
 * things that de-register it as well. So we'll also register the menu
 * every time this script gets run. It's using the same ID, so in my
 * experimentation, nothing happens when we re-register it if it's still
 * there.
 */
registerContextMenu();

browser.runtime.onInstalled.addListener(() => {
	console.log('onInstalled');
	registerContextMenu();
});

browser.menus.onClicked.addListener(async (info, tab) => {
	if (info.menuItemId === MENU_ID) {
		const [result] = await browser.scripting.executeScript({
			func: async function (targetElementId) {
				// get the image we want to copy
				const targetImgElem = browser.menus.getTargetElement(targetElementId);
				// make a canvas of the same size as the image and get its contents
				const canvasElem = document.createElement('canvas');
				canvasElem.height = targetImgElem.naturalHeight;
				canvasElem.width = targetImgElem.naturalWidth;
				const ctx = canvasElem.getContext('2d');
				// draw the image to the canvas
				// normally this is insecure but we have host privileges so ff lets us do it
				ctx.drawImage(targetImgElem, 0, 0);
				// serialize the canvas to a png bitstream
				const blobPromise = new Promise(complete => {
					canvasElem.toBlob(blob => complete(blob), 'image/png');
				});
				const blob = await blobPromise;
				return blob;
			}, args: [info.targetElementId], target: { tabId: tab.id }
		});
		const blob = result.result;
		// images can only be written to the clipboard in arraybuffer format, so make it an arraybuffer
		const arrayBuffer = await blob.arrayBuffer();
		// write to clipboard
		browser.clipboard.setImageData(arrayBuffer, 'png');
		console.log('copied!');
	}
});
