interface Env {
	ASSETS: R2Bucket;
	AUTH_SECRET: string;
}

const headers = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Max-Age': '86400',
};

export default {
	async fetch(request, env): Promise<Response> {
		if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
		if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers });
		const data = await request.formData();
		const files = data.getAll('file[]') as File[];
		const succMap: Record<string, string> = {};
		const errFiles: string[] = [];
		const endpoint = 'https://assets.viva-la-vita.org/';
		const futures = [];
		for (const file of files) {
			const timestamp = Math.round(new Date().getTime() / 1000);
			const ext = /(?:\.([^.]+))?$/.exec(file.name)![1];
			const key = `${timestamp}.${ext}`;
			const future = env.ASSETS.put(key, file)
				.then(() => {
					succMap[key] = endpoint + key;
				})
				.catch(() => {
					errFiles.push(file.name);
				});
			futures.push(future);
		}
		await Promise.all(futures);
		const result = {
			msg: '成功上传',
			code: 0,
			data: { errFiles, succMap },
		};
		return new Response(JSON.stringify(result), { status: 200, headers });
	},
} satisfies ExportedHandler<Env>;
