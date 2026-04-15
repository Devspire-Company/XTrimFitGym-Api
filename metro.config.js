const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add PNG (uppercase) extension to assetExts
config.resolver.assetExts.push('PNG');

const metroConfig = withNativeWind(config, { input: './global.css' });

// tslib's package "exports" can resolve to modules/index.js, whose default import
// from ../tslib.js breaks under Metro (Apollo Client then crashes at load).
// Force the classic CJS entry so Expo Go / Metro get a stable tslib.
const tslibCjsPath = require.resolve('tslib/tslib.js');
const upstreamResolveRequest = metroConfig.resolver.resolveRequest;
metroConfig.resolver.resolveRequest = (context, moduleName, platform) => {
	if (moduleName === 'tslib') {
		return { type: 'sourceFile', filePath: tslibCjsPath };
	}
	if (upstreamResolveRequest) {
		return upstreamResolveRequest(context, moduleName, platform);
	}
	return context.resolveRequest(context, moduleName, platform);
};

module.exports = metroConfig;
