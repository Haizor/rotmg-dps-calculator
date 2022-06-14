import React, { MouseEventHandler, ReactNode } from "react";
import { CSSProperties } from "react";
import { Sprite, TextureProvider, AssetManager } from "@haizor/rotmg-utils";


type Props = {
	sprite?: Sprite;
	texture?: TextureProvider;
	size?: number;
	padding?: number;
	className?: string;
	style?: CSSProperties;
	onClick?: MouseEventHandler;
	children?: ReactNode
}

export default class SpriteComponent extends React.Component<Props, {}> {
	static assetManager?: AssetManager;

	static setAssetManager(manager: AssetManager) {
		SpriteComponent.assetManager = manager;
	}

	render() {
		const { assetManager } = SpriteComponent;
		const size = this.props.size ?? 64;
		const padding = this.props.padding ?? 8;
		let sprite = this.props.sprite;

		if (sprite === undefined && this.props.texture !== undefined && assetManager !== undefined) {
			sprite = assetManager.get<Sprite>("sprites", {texture: this.props.texture.getTexture(0)})?.value;
		}

		let style: CSSProperties = {};

		if (sprite !== undefined) {
			const data = sprite.getData();
			const spriteSize = Math.max(sprite.getData().position.w, sprite.getData().position.h);

			const ratio = size / spriteSize;
		
			style.width = spriteSize + "px";
			style.height = spriteSize + "px";
			style.backgroundImage = `url("${sprite.getAtlasSource()}")`;
			style.backgroundPosition = `-${Math.floor(data.position.x)}px -${Math.floor(data.position.y)}px`
			style.transform = `scale(${ratio * 100}%)`
			style.transformOrigin = "0% 0%";
			
			const outlineSize = 0;
		
			const outline = `
				drop-shadow(${outlineSize}px ${outlineSize}px 0.01em black)
				drop-shadow(${-outlineSize}px ${outlineSize}px 0.01em black)
				drop-shadow(${-outlineSize}px ${-outlineSize}px 0.01em black)
				drop-shadow(${outlineSize}px ${-outlineSize}px 0.01em black)
			`
			style.filter = outline;
		} else if (this.props.texture !== undefined) {
			style = {
				backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIBAMAAAA2IaO4AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURQAAAP8A3JSaE90AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAASSURBVBjTY2BgEBREJzBEGBgAFWgBEZPDxfIAAAAASUVORK5CYII=")`,
				backgroundSize: "100%",
				width: size + "px",
				height: size + "px",
			}
		} else {
			style = {
				width: size + "px",
				height: size + "px",
			}
		}

		if (navigator.userAgent.indexOf("Firefox") !== -1) {
			style.imageRendering = "crisp-edges"
		} else {
			style.imageRendering = "pixelated"
		}
	
	
		return (
			<div className={this.props.className} style={{...this.props.style, width: size + padding + "px", height: size + padding + "px", display: "flex", justifyContent: "center", alignItems: "center"}} onClick={this.props.onClick}>
				<div style={{width: size + "px", height: size + "px"}}>
					<div style={style}>
						{this.props.children}
					</div>
				</div>
			</div>
		)
	}
}