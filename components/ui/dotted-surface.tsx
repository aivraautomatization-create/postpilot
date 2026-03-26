'use client';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Fallback for useTheme if next-themes is not yet installed or configured
let useTheme: () => { theme: string | undefined } = () => ({ theme: 'dark' });

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nextThemes = require('next-themes');
  if (nextThemes && nextThemes.useTheme) {
    useTheme = nextThemes.useTheme;
  }
} catch (e) {
  console.warn('next-themes not found, falling back to dark theme for DottedSurface');
}

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'>;

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
	const { theme } = useTheme();

	const containerRef = useRef<HTMLDivElement>(null);
	const countRef = useRef(0);
	const animationIdRef = useRef<number>(0);
	const sceneRef = useRef<{
		scene: THREE.Scene;
		camera: THREE.PerspectiveCamera;
		renderer: THREE.WebGLRenderer;
		geometry: THREE.BufferGeometry;
	} | null>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		const SEPARATION = 150;
		const AMOUNTX = 40;
		const AMOUNTY = 60;

		// Scene setup
		const scene = new THREE.Scene();
		scene.fog = new THREE.Fog(0x0F1115, 2000, 10000);

		const camera = new THREE.PerspectiveCamera(
			60,
			window.innerWidth / window.innerHeight,
			1,
			10000,
		);
		camera.position.set(0, 355, 1220);

		const renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true,
		});
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(0x000000, 0);

		containerRef.current.appendChild(renderer.domElement);

		// Create particles
		const positions: number[] = [];
		const colors: number[] = [];

		// Create geometry for all particles
		const geometry = new THREE.BufferGeometry();

		for (let ix = 0; ix < AMOUNTX; ix++) {
			for (let iy = 0; iy < AMOUNTY; iy++) {
				const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
				const y = 0;
				const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

				positions.push(x, y, z);
				if (theme === 'dark' || !theme) {
					// Brand cyan dots: #00BFFF → R:0, G:0.75, B:1
					colors.push(0.05, 0.55, 0.72);
				} else {
					colors.push(0.06, 0.27, 0.4);
				}
			}
		}

		geometry.setAttribute(
			'position',
			new THREE.Float32BufferAttribute(positions, 3),
		);
		geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

		// Create material
		const material = new THREE.PointsMaterial({
			size: 4,
			vertexColors: true,
			transparent: true,
			opacity: 0.6,
			sizeAttenuation: true,
		});

		// Create points object
		const points = new THREE.Points(geometry, material);
		scene.add(points);

		// Animation function
		const animate = () => {
			animationIdRef.current = requestAnimationFrame(animate);

			const positionAttribute = geometry.attributes.position;
			const positionsArray = positionAttribute.array as Float32Array;

			let i = 0;
			const currentCount = countRef.current;
			
			for (let ix = 0; ix < AMOUNTX; ix++) {
				for (let iy = 0; iy < AMOUNTY; iy++) {
					const index = i * 3;

					// Animate Y position with sine waves
					positionsArray[index + 1] =
						Math.sin((ix + currentCount) * 0.3) * 50 +
						Math.sin((iy + currentCount) * 0.5) * 50;

					i++;
				}
			}

			positionAttribute.needsUpdate = true;
			renderer.render(scene, camera);
			countRef.current += 0.05;
		};

		// Handle window resize
		const handleResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		};

		window.addEventListener('resize', handleResize);

		// Start animation
		animate();

		// Store references
		sceneRef.current = {
			scene,
			camera,
			renderer,
			geometry
		};

		// Cleanup function
		return () => {
			window.removeEventListener('resize', handleResize);
			cancelAnimationFrame(animationIdRef.current);

			if (sceneRef.current) {
				// Clean up Three.js objects
				sceneRef.current.geometry.dispose();
				material.dispose();
				sceneRef.current.renderer.dispose();

				if (containerRef.current && sceneRef.current.renderer.domElement) {
					containerRef.current.removeChild(sceneRef.current.renderer.domElement);
				}
			}
		};
	}, [theme]);

	return (
		<div
			ref={containerRef}
			className={cn('pointer-events-none fixed inset-0 z-[-1]', className)}
			{...props}
		/>
	);
}
