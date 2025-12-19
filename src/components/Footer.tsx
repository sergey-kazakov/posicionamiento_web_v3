// src/components/Footer.tsx
import React from "react";
import { useApp } from "../store";
import { t } from "../i18n";

export default function Footer() {
  const { project } = useApp();
  const tr = t(project.lang);

  return <footer className="app-footer">{tr.footerText}</footer>;
}