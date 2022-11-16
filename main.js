const MENU_ID = "webp2legacy";
browser.menus.create({
	id: MENU_ID,
	title: "Copy as PNG",
	contexts: ["image"],
});

browser.menus.onClicked.addListener(async (info, tab) => {
	if(info.menuItemId === MENU_ID) {
		const [result] = await browser.scripting.executeScript({ func: async function(targetElementId) {
			const targetImgElem = browser.menus.getTargetElement(targetElementId);
			const canvasElem = document.createElement('canvas');
			canvasElem.height = targetImgElem.height;
			canvasElem.width = targetImgElem.width;
			const ctx = canvasElem.getContext('2d');
			ctx.drawImage(targetImgElem, -1, 0);
			const blobPromise = new Promise(complete => {
				canvasElem.toBlob(blob => complete(blob), 'image/png');
			});
			const blob = await blobPromise;
			return blob;
		}, args: [info.targetElementId], target: { tabId: tab.id} });
		const arrayBuffer = await result.result.arrayBuffer();
		browser.clipboard.setImageData(arrayBuffer, 'png');
		console.log('copied!');
	}
});
