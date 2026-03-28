import React from 'react';
import { motion } from 'framer-motion';
import { Printer, ScanLine, Copy, ArrowLeft, FileUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFileIcon, getFileExt } from '../printUtils';

export function ServiceSelectView({ selectService, switchToNewKiosk }) {
    const services = [
        {
            type: 'print',
            icon: Printer,
            title: 'Print',
            desc: 'Upload a document to print',
        },
        {
            type: 'scan',
            icon: ScanLine,
            title: 'Scan',
            desc: 'Scan a document to PDF',
        },
        {
            type: 'xerox',
            icon: Copy,
            title: 'Xerox',
            desc: 'Photocopy a document',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <div className="text-center mb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Choose a service</span>
              <h3 className="text-lg font-semibold tracking-tight text-foreground mt-1">What would you like to do?</h3>
            </div>

            {services.map((svc, i) => {
                const Icon = svc.icon;
                return (
                    <motion.button
                        key={svc.type}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => selectService(svc.type)}
                        className="group w-full flex items-center gap-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-5 text-left transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-foreground font-semibold tracking-tight">{svc.title}</p>
                            <p className="text-sm text-muted-foreground/80 leading-relaxed">{svc.desc}</p>
                        </div>
                    </motion.button>
                );
            })}

            <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => switchToNewKiosk()}
                className="w-full text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl mt-3"
              >
                <ArrowLeft className="mr-1 w-4 h-4" /> Scan Different Kiosk
              </Button>
            </motion.div>
        </motion.div>
    );
}

export function FileUploadView({ file, status, handleFileSelect }) {
  const [isDragging, setIsDragging] = React.useState(false);

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-5">
      <label 
        className="block w-full cursor-pointer group"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
          file 
          ? 'border-white/[0.20] bg-white/[0.04]' 
          : isDragging
          ? 'border-white/40 bg-white/[0.06] scale-[1.01]'
          : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] hover:bg-white/[0.04]'
        }`}>
          <div className={`mx-auto h-16 w-16 mb-4 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            file 
            ? 'bg-white/[0.08] border border-white/[0.12]' 
            : isDragging
            ? 'bg-white/[0.12] border border-white/20'
            : 'bg-white/[0.05] border border-white/[0.08] group-hover:scale-105 group-hover:bg-white/[0.08]'
          }`}>
            <FileUp className={`h-8 w-8 ${file || isDragging ? 'text-white' : 'text-muted-foreground group-hover:text-white'}`} />
          </div>
        
          <p className="text-base font-semibold tracking-tight mb-1 text-foreground">
            {file ? `${getFileIcon(file.name)} ${file.name}` : isDragging ? "Ready to drop" : "Drop file here"}
          </p>
        
          {file && (
            <>
              <p className="text-[13px] text-muted-foreground/70">{(file.size / 1024).toFixed(1)} KB</p>
              {getFileExt(file.name) !== 'pdf' && (
                <span className="inline-flex items-center gap-1 mt-2 text-xs text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-full">
                  ⚡ Will be converted to PDF
                </span>
              )}
            </>
          )}
        
          {!file && (
            <>
              <p className="text-xs text-muted-foreground/70 mt-2">
                {isDragging ? "Drop your file to upload" : "or click to browse"}
              </p>
              <p className="text-[11px] text-muted-foreground/50 mt-1.5">
                PDF · Word · Text · Images
              </p>
            </>
          )}
        </div>
      
        <input 
          type="file" 
          className="hidden" 
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.rtf,.odt,.md"
          onChange={e => handleFileSelect(e.target.files[0])}
          disabled={status === 'CALCULATING'}
        />
      </label>
    

      {status === 'CALCULATING' && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 text-foreground bg-white/[0.03] rounded-2xl p-4 border border-white/[0.08]"
        >
          <Loader2 className="animate-spin h-5 w-5"/>
          <span className="text-sm font-medium">Processing file...</span>
        </motion.div>
      )}
   </div>
  );
}
