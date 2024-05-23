import { App, Editor, EventRef, MarkdownPostProcessorContext, MarkdownView, Modal, Notice, Platform, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import {
	EditorView,
	PluginValue,
	ViewPlugin,
	ViewUpdate,
	DecorationSet,
	Decoration,
} from "@codemirror/view";

interface PluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	mySetting: 'default'
}


class VerticalLinesPluginValue implements PluginValue {
	constructor(
		private view: EditorView,
		private callback: (dom: HTMLElement) => void,

	) {
		console.log(this.view);
	}

	update(update: ViewUpdate) {
		// console.log("update", update);
		this.callback(this.view.dom);

		// if (
		// 	update.docChanged ||
		// 	update.viewportChanged ||
		// 	update.geometryChanged ||
		// 	update.transactions.some((tr) => tr.reconfigured)
		// ) {
		// 	this.scheduleRecalculate();
		// }
	}
}

export default class HtmlLocalImgPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();
		console.log("Running on ---------------onload")


		this.registerMarkdownPostProcessor((element, ctx) => {
			this.processElement(element, ctx.sourcePath);
		})

		this.registerEditorExtension(
			ViewPlugin.define(
				(view) =>
					new VerticalLinesPluginValue(
						view,
						dom => {
							const af = this.app?.workspace.getActiveFile()
							if (af) {
								this.processElement(dom,af.path)
							}
						}
					)),
		);
	}

	processElement(element: HTMLElement, sourcePath: string) {
		let targetLinks = Array.from(element.getElementsByTagName("img"));
		// console.log('targetLinks: ', targetLinks)

		if (this.app?.metadataCache == null) {
			return;
		}
		for (const link of targetLinks) {
			// console.log('link.src: ', link.src);
			if (link.src == "" || link.src.includes("https://")) {
				continue;
			}
			let clean_link = link.src.replace('app://obsidian.md/', '')
			if (link.attributes.getNamedItem('src')!.value.startsWith('.')) {
				clean_link = link.attributes.getNamedItem('src')!.value
			}
			// console.log('clean_link: ' + clean_link)

			let imageFile = this.app.metadataCache.getFirstLinkpathDest(clean_link, sourcePath);
			if (imageFile == null) {
				// console.log('null clean_link: ' + clean_link)
				// console.log('imageFile is null')
				continue;
			}
			// let active_path0 = this.app.vault.adapter.getResourcePath(imageFile.path);
			let active_path = this.app.vault.getResourcePath(imageFile)
			// console.log('active_path0: ' + active_path0)
			// For iOS
			clean_link = clean_link.replace('capacitor://localhost/', '')
			// console.log('clean_link: ' + clean_link)
			let full_link = active_path + '/' + clean_link
			// console.log('full_link: ' + full_link)
			link.src = full_link
			link.style.maxWidth = "100%"
			if (Platform.isMobile) {
				console.log("Running on mobile platform - setting object fit and height of img")
				link.style.objectFit = "contain"
				link.height = 100
			}
		}
	}
	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
