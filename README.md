<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0C7A68,100:2BB596&height=220&section=header&text=Shelfora&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=36&desc=See%20the%20shelf.%20Know%20what%20to%20refill.&descAlignY=58&descSize=22" width="100%" alt="Shelfora: See the shelf. Know what to refill."/>

<a href="https://shelfora-peach.vercel.app"><img src="https://img.shields.io/badge/🚀_Live_Demo-shelfora--peach.vercel.app-0C7A68?style=for-the-badge" alt="Live demo"/></a>
<a href="docs/shelfora-linkedin-4x5.mp4"><img src="https://img.shields.io/badge/▶_Watch-30s_Demo_Video-F2B33D?style=for-the-badge" alt="Demo video"/></a>

<br/><br/>

<img src="https://img.shields.io/badge/YOLO11-Ultralytics-111F68?style=flat-square" alt="YOLO11"/>
<img src="https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python"/>
<img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI"/>
<img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=flat-square&logo=opencv&logoColor=white" alt="OpenCV"/>
<img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"/>
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
<img src="https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
<img src="https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel"/>

<br/><br/>

**Shelfora turns the CCTV cameras a store already has into live shelf inventory.**<br/>
It counts every product on the shelf, notices what's selling fast,<br/>
and tells the store manager what to refill first, before customers walk out empty-handed.

</div>

---

## 🛒 The problem

A customer comes in for juice, finds an empty shelf, and leaves. Nobody notices until the end of the day.
Stock counts in most stores lag hours behind what's actually on the shelf, and the products that run out
first are usually the ones selling best.

## 💡 How it works

```mermaid
flowchart LR
    A["📷 Existing CCTV"] --> B["🤖 YOLO detection"]
    B --> C["📦 Products per shelf zone"]
    C
