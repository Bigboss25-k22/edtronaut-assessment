import prisma from '../db/prisma';
import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/httpError';
import {
    CreateSubmissionBody,
    SubmissionStatus,
    SubmissionCreateResult,
    SubmissionUpdateResult,
    SubmissionSubmitResult,
    SubmissionContent,
} from '../types';

const createSubmision = async (data: CreateSubmissionBody): Promise<SubmissionCreateResult> => {
    const submission = await prisma.submission.create({
        data: {
            learnerId: data.learnerId,
            simulationId: data.simulationId,
            content: { source_code: '', documentation: '' } as Prisma.JsonObject,
            status: SubmissionStatus.IN_PROGRESS,
        },
    });

    return submission;
};

const updateSubmission = async (
    submissionId: string,
    content: { source_code?: string; documentation?: string }
): Promise<SubmissionUpdateResult> => {
    const existingSubmission = await prisma.submission.findUnique({
        where: { id: submissionId },
    });

    if (!existingSubmission) {
        throw new HttpError(404, 'Submission not found');
    }

    if (existingSubmission.status === SubmissionStatus.SUBMITTED) {
        throw new HttpError(400, 'Cannot update a submitted submission');
    }

    const updatedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        data: { content: content as Prisma.JsonObject },
    });

    return updatedSubmission;
}

const submitSubmission = async (submissionId: string): Promise<SubmissionSubmitResult> => {
    const existing = await prisma.submission.findUnique({
        where: { id: submissionId },
    });

    if (!existing) {
        throw new HttpError(404, 'Submission not found');
    }

    if (existing.status === SubmissionStatus.SUBMITTED) {
        throw new HttpError(400, 'Submission has already been submitted');
    }

    const submittedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        data: { status: SubmissionStatus.SUBMITTED },
        select: { id: true, status: true },
    });

    return submittedSubmission;
}

export const SubmissionService = {
    createSubmision,
    updateSubmission,
    submitSubmission
};